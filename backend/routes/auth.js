import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import iconv from 'iconv-lite'; 
import pkg from '@prisma/client';
import crypto from 'crypto';
const { PrismaClient } = pkg;

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const prisma = new PrismaClient(); // 🌟 初始化 Prisma 實例

// Store for in-memory session (in production, use Redis or database)
const userSessions = new Map();

/**
 * POST /api/auth/google
 * 驗證 Google id_token、呼叫校內 AD API 驗證身分、操作資料庫並建立 session
 */
router.post('/google', async (req, res, next) => {
  try {
    const { Token, id_token, credential } = req.body;
    const tokenToVerify = credential || Token || id_token;

    if (!tokenToVerify) {
      return res.status(400).json({ error: 'Missing Token or id_token' });
    }

    // 1. 驗證 Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenToVerify,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const userId = payload.sub;
    const email = payload.email;

    // 🌟 網域安全性檢查：強制鎖定學校信箱
    if (!email.endsWith('@nkust.edu.tw')) {
      return res.status(403).json({ error: '登入遭拒：請使用學校信箱 (@nkust.edu.tw) 登入' });
    }
    
    // 2. 擷取 @ 前面的帳號 (例如：學號或教職員代碼)
    const accountId = email.split('@')[0].toUpperCase(); // 建議轉大寫統一格式

    // 3. 由後端去呼叫 HTTP 的 AD 驗證 API (並處理 Big5 亂碼)
    let adAuditData = null;
    try {
      console.log(`🔍 正在向校內系統驗證身分: ${accountId}`);
      const adRes = await axios.get(`http://163.18.2.238:8080/nkust/jsp/ADAudit.jsp?acc=${accountId}`, {
        timeout: 5000,
        responseType: 'arraybuffer' // 關鍵 1：接收原始二進位資料
      });
      
      // 關鍵 2：將 Big5 轉為 UTF-8
      const decodedText = iconv.decode(Buffer.from(adRes.data), 'big5').trim();
      console.log(`✅ AD 系統原始回傳:`, decodedText);

      // 關鍵 3：解析逗號分隔的字串
      const parts = decodedText.split(',');
      if (parts.length >= 4) {
        const rawDeptAndName = parts[1]; // "資訊管理系xXX"
        const college = parts[2];        // "管理學院"
        const rawIdentity = parts[3];    // "日間部學生"

        // 解析身分
        let determinedRole = '未知';
        if (rawIdentity.includes('學生')) {
          determinedRole = '學生';
        } else if (rawIdentity.includes('教職員') || rawIdentity.includes('教師') || rawIdentity.includes('職')) {
          determinedRole = '老師';
        }

        // 解析系所與姓名
        let cleanDepartment = rawDeptAndName;
        let parsedName = ''; // 👉 新增：用來儲存解析出來的姓名

        // 👉 修改正規表達式：增加 (.*) 捕捉剩下的字串當作姓名
        const deptMatch = rawDeptAndName.match(/(.*?[系所學程班])(.*)/);
        if (deptMatch) {
          cleanDepartment = deptMatch[1]; // 科系 (例如："資訊管理系")
          parsedName = deptMatch[2];      // 姓名 (例如："xXX")
        } else {
          // 例外情況：如果沒有匹配到系所結尾字，使用原本的 fallback 邏輯
          // (加上可選串連運算子避免 payload 未定義時報錯)
          parsedName = payload?.name || ''; 
          cleanDepartment = rawDeptAndName.replace(parsedName, '');
        }

        adAuditData = {
          role: determinedRole,        // '學生' 或 '老師'
          name: parsedName,            // 👉 新增：姓名
          department: cleanDepartment, // '資訊管理系'
          college: college,            // '管理學院'
          full_identity: rawIdentity   // '日間部學生'
        };
        
        console.log(`🎯 成功解析身分資料:`, adAuditData);
      }
    } catch (apiErr) {
      console.error(`❌ 校內 AD API 呼叫或解析失敗:`, apiErr.message);
    }

    // 🌟 4. 操作資料庫：檢查並同步使用者資料 (改用 upsert)
    // 💡 邏輯：優先使用 AD 解析出來的姓名，如果 AD 解析失敗則退回使用 Google 姓名
    const finalName = adAuditData?.name || payload.name || '使用者';

    let dbUser = await prisma.users.upsert({
      where: { email: email },
      update: {
        // 若帳號已存在：更新姓名與 AD 相關欄位
        name: finalName,
        role: adAuditData?.role,
        department: adAuditData?.department,
        college: adAuditData?.college,
        full_identity: adAuditData?.full_identity
      },
      create: {
        // 若為新帳號：建立完整紀錄
        id: crypto.randomUUID(),       
        email: email,                  
        student_id: accountId,         
        name: finalName,               // 👈 改由 adAuditData 提供
        role: adAuditData?.role,       // 👈 新增寫入
        department: adAuditData?.department, // 👈 新增寫入
        college: adAuditData?.college, // 👈 新增寫入
        full_identity: adAuditData?.full_identity // 👈 新增寫入
      }
    });

    console.log(`✅ 已成功同步資料庫紀錄 (更新或建立): ${email}`);

    // ==========================================
    // 🌟 5. 新增：向 LiteLLM (學長端 API) 驗證或註冊帳號
    // ==========================================
    const LITELLM_API_URL = process.env.LITELLM_API_URL;
    const LITELLM_MANAGE_KEY = process.env.LITELLM_MANAGE_KEY;

    if (LITELLM_API_URL && LITELLM_MANAGE_KEY) {
      const litellmHeaders = {
        'Authorization': `Bearer ${LITELLM_MANAGE_KEY}`,
        'Content-Type': 'application/json'
      };

      try {
        // 🔍 1. 先定義網址並印出來，確保組裝沒有多出斜線或 v1
        const infoUrl = `${LITELLM_API_URL}/user/info?user_id=${accountId}`;
        console.log(`🔍 [LiteLLM] 準備查詢帳號: ${infoUrl}`);
        
        // 檢查 LiteLLM 是否已有此學號
        await axios.get(infoUrl, { headers: litellmHeaders });
        console.log(`✅ [LiteLLM] 系統確認已有帳號: ${accountId}`);
        
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // 若找不到，則自動建立
          try {
            const defaultBudget = (adAuditData?.role === '老師') ? 500 : 100;
            const newUrl = `${LITELLM_API_URL}/user/new`;
            
            console.log(`⚠️ [LiteLLM] 查無帳號，準備打向新建網址: ${newUrl}`);
            
            await axios.post(newUrl, {
              user_id: accountId,
              user_role: 'internal_user',
              max_budget: defaultBudget,
              auto_create_key: false
            }, { headers: litellmHeaders });
            
            console.log(`🆕 [LiteLLM] 成功建立新帳號: ${accountId} (預設額度: ${defaultBudget})`);
            
          } catch (createErr) {
            // 🔍 2. 把真實的錯誤代碼和 LiteLLM 回傳的詳細原因印出來
            console.error(`❌ [LiteLLM] 建立帳號失敗，狀態碼:`, createErr.response?.status);
            console.error(`❌ [LiteLLM] 錯誤詳情:`, createErr.response?.data || createErr.message);
          }
        } else {
          // 處理 401 Unauthorized 或 500 等其他錯誤
          console.error(`❌ [LiteLLM] 查詢連線異常，狀態碼:`, error.response?.status);
          console.error(`❌ [LiteLLM] 錯誤詳情:`, error.response?.data || error.message);
        }
      }
    } else {
      console.warn(`⚠️ 未設定 LITELLM_API_URL 或 LITELLM_MANAGE_KEY，跳過學長端系統註冊。`);
    }
    // ==========================================

    // 🌟 6. 判斷使用者是否已同意服務條款
    const tos_agreed = (dbUser.agreed_at || dbUser.tos_agreed === 1) ? true : false;

    // 7. 建立完整的 session 使用者物件
    const user = {
      id: dbUser.id,
      email: email,
      name: payload.name || '使用者',
      picture: payload.picture || '',
      student_id: accountId,                      
      nkust_account: accountId,
      department: adAuditData?.department || '',  
      role: adAuditData?.role || '學生',            
      ad_audit_info: adAuditData,
      tos_agreed: tos_agreed 
    };

    req.session.userId = userId;
    req.session.user = user;

    userSessions.set(userId, {
      ...user,
      loginAt: new Date(),
      idToken: tokenToVerify
    });

    // 8. 產生 JWT Token 
    const token = jwt.sign(
      { 
        student_id: accountId, // 統一改用 accountId (學號) 而不是 Google Sub，方便各路由串接
        email: email,
        name: payload.name,
        account: accountId,
        ad_audit_info: adAuditData,
        tos_agreed: tos_agreed
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    req.session.jwtToken = token;

    // 9. 回傳給前端
    res.json({
      success: true,
      user,              
      access_token: token,
      token,
      student_id: accountId
    });
  } catch (error) {
    console.error('Google token verification error:', error);
    next({
      status: 401,
      message: 'Google token verification failed'
    });
  }
});

/**
 * GET /api/auth/config
 * 提供前端 Google Client ID
 */
router.get('/config', (req, res) => {
  res.json({ google_client_id: process.env.GOOGLE_CLIENT_ID });
});

/**
 * 🌟 新增：GET /api/auth/me (相容前端 Check.jsx 的登入狀態檢查)
 */
router.get('/me', (req, res) => {
  if (req.session.userId && req.session.user) {
    res.json({
      logged_in: true,
      user: req.session.user
    });
  } else {
    res.json({
      logged_in: false,
      user: null
    });
  }
});

/**
 * 🌟 新增：POST /api/auth/agree-tos (更新使用者同意時間)
 */
router.post('/agree-tos', async (req, res) => {
  try {
    const { email } = req.body;

    // 驗證當前 Session 安全性
    if (!req.session || !req.session.user || req.session.user.email !== email) {
      return res.status(401).json({ status: "error", message: "無效的操作權限" });
    }

    // 💡 更新資料庫中的屬性欄位：agreed_at
    await prisma.users.update({
      where: { email: email },
      data: { 
          agreed_at: new Date(),
          tos_agreed: 1 // 💡 配合你 Schema 裡的 Int? @default(0) 欄位
      }
    });

    // 同步更新當前 Session 紀錄，避免前端重複阻擋
    req.session.user.tos_agreed = true;

    res.json({ status: "success" });
  } catch (error) {
    console.error("更新服務條款同意紀錄失敗:", error);
    res.status(500).json({ status: "error", message: "伺服器錯誤" });
  }
});

/**
 * GET /api/auth/session
 * 取得現有登入狀態 (保留原有結構)
 */
router.get('/session', (req, res) => {
  if (req.session.userId && req.session.user) {
    res.json({
      user: req.session.user,
      access_token: req.session.jwtToken || null,
      token: req.session.jwtToken || null
    });
  } else {
    res.json({
      user: null,
      access_token: null,
      token: null
    });
  }
});

/**
 * POST /api/auth/logout (或改為 GET 配合跳轉)
 * 清除 session
 */
router.post('/logout', (req, res, next) => {
  const userId = req.session.userId;

  if (userId) {
    userSessions.delete(userId);
  }

  req.session.destroy((err) => {
    if (err) {
      return next({
        status: 500,
        message: 'Failed to clear session'
      });
    }

    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// 為了相容前端 Check.jsx 中的登出 a 標籤跳轉，額外提供 GET 登出方法
router.get('/logout', (req, res) => {
  const userId = req.session.userId;
  if (userId) userSessions.delete(userId);
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/portal/');
  });
});

/**
 * Middleware 與驗證工具
 */
export const getJwtFromRequest = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return req.session?.jwtToken || null;
};

export const verifyJwtToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
};

export const requireJwtAuth = (req, res, next) => {
  const token = getJwtFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  try {
    req.user = verifyJwtToken(token); 
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

/**
 * GET /api/auth/user (protected)
 */
router.get('/user', requireJwtAuth, (req, res) => {
  res.json({
    user: {
      student_id: req.user.student_id,
      email: req.user.email,
      name: req.user.name
    }
  });
});

export default router;