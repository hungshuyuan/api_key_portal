import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dotenv from 'dotenv';
import { requireJwtAuth } from './auth.js';
import axios from 'axios';

dotenv.config();

const router = express.Router();
const sql3 = sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================
// 🌟 保留：連線到 SQLite 本地資料庫（用於教師真實課程清單）
// =========================================================
const dbPath = path.resolve(__dirname, '../管理學院_courses.db');
const db = new sql3.Database(dbPath, (err) => {
    if (err) {
        console.error('本地課程資料庫連線失敗:', err.message);
        return;
    }
    console.log('✅ 已成功連線至 SQLite 課程教師驗證資料庫');
});

const upload = multer({ storage: multer.memoryStorage() });

// 外部系統基礎網址與金鑰設定
const EXTERNAL_API_URL = 'https://www.iai.nkust.edu.tw/iaibackend/api/courses';
const LITELLM_KEY = process.env.LITELLM_MANAGE_KEY;

// =========================================================
// 🌟 修正後 API 1: 取得下拉式選單的課程 (GET - 安全連動 Token 版)
// =========================================================
router.get('/teacher/courses', requireJwtAuth, (req, res) => {
    // 🌟 關鍵修正：不再從 req.query 拿名字！
    // 而是從 requireJwtAuth 解碼後封裝的 req.user 裡面直接取得 Google 帳號姓名。
    // (註：具體屬性名稱是 .name 還是 .displayName，需對齊您 auth.js 產生 Token 時的 payload 設定)
    const teacherName = req.user.name; 

    if (!teacherName) {
        return res.status(401).json({ error: '認證憑證中缺少教師姓名資訊' });
    }
    
    console.log(`\n👨‍🏫 [課程清單 API] 當前登入教師: ${teacherName}，正在查詢 SQLite 課表...`);

    const sql = "SELECT 當期課號, 課程名稱 FROM academic_courses WHERE 教師 = ?";
    db.all(sql, [teacherName], (err, rows) => {
        if (err) {
            console.error("❌ SQLite 查詢失敗原因:", err.message);
            return res.status(500).json({ error: '查詢錯誤' });
        }
        
        console.log(`   ✅ 成功查到 ${rows.length} 堂課程`);
        res.json({ courses: rows.map(row => ({ id: row['當期課號'], name: row['課程名稱'] })) });
    });
});

// =========================================================
// API 2: 上傳名單 (POST) - 純轉發 XML 與檔案至外部
// =========================================================
router.post('/new', requireJwtAuth, upload.single('students'), async (req, res) => {
    const courseID = req.body.courseID || req.body.course_id;
    const courseName = req.body.courseName || req.body.course_name;

    console.log(`\n📥 [上傳名單 API] 收到課程: ${courseID} - ${courseName}`);

    if (!req.file) {
        return res.status(400).json({ detail: "請上傳 XML 學生名單檔案" });
    }

    try {
        const extFormData = new FormData();
        extFormData.append('courseID', courseID);
        extFormData.append('courseName', courseName);
        
        // 將 Multer 的 buffer 轉為 Blob 塞入 FormData
        const fileBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
        extFormData.append('students', fileBlob, req.file.originalname);

        const targetUrl = `${EXTERNAL_API_URL}/new`;
        console.log(`   ⏳ 正在將 XML 轉發至外部系統: ${targetUrl}`);

        const extRes = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${LITELLM_KEY}` },
            body: extFormData
        });

        const data = await extRes.json();
        
        if (!extRes.ok) {
            console.error(`   ❌ 外部系統拒絕: HTTP ${extRes.status}`, data);
            return res.status(extRes.status).json(data);
        }

        console.log(`   ✅ 外部系統 XML 註冊成功！`);
        return res.json(data);

    } catch (err) {
        console.error("❌ 轉發名單時發生非預期錯誤:", err);
        res.status(500).json({ detail: "伺服器內部錯誤，轉發名單失敗" });
    }
});

// =========================================================
// API 4: 批量派發金鑰與額度 (POST) - 純代理
// =========================================================
router.post('/keys/generate', requireJwtAuth, async (req, res) => {
    const { courseID, budget } = req.body;
    console.log(`\n🚀 [API 4 觸發] 轉發批量金鑰派發請求。課號: ${courseID}, 初始額度: ${budget}`);

    try {
        const targetUrl = `${EXTERNAL_API_URL}/keys/generate`;
        const extRes = await fetch(targetUrl, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${LITELLM_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ courseID, budget })
        });

        const data = await extRes.json();

        if (!extRes.ok) {
            console.error(`   ❌ 外部系統派發金鑰失敗: HTTP ${extRes.status}`, data);
            return res.status(extRes.status).json(data);
        }

        console.log(`   🎉 外部系統成功為全班生成金鑰！`);
        return res.json(data);

    } catch (err) {
        console.error("❌ 轉發金鑰生成請求時發生錯誤:", err);
        res.status(500).json({ detail: "伺服器內部錯誤，金鑰派發失敗" });
    }
});

// =========================================================
// API 5: 調整個別金鑰預算 (POST) - 純代理
// =========================================================
router.post('/keys/update_budget', requireJwtAuth, async (req, res) => {
    const { updateBudget, key_alias } = req.body;
    console.log(`\n⚙️ [API 5 觸發] 轉發預算調整請求。別名: ${key_alias}, 新額度: ${updateBudget}`);

    try {
        const targetUrl = `${EXTERNAL_API_URL}/keys/update_budget`;
        const extRes = await fetch(targetUrl, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${LITELLM_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ updateBudget, key_alias })
        });

        const data = await extRes.json();

        if (!extRes.ok) {
            return res.status(extRes.status).json(data);
        }

        return res.json(data);

    } catch (err) {
        console.error("❌ 轉發預算更新請求時發生錯誤:", err);
        res.status(500).json({ detail: "伺服器內部錯誤，更新預算失敗" });
    }
});

// =========================================================
// API 6: 查詢課程中所有的 API (GET) - 網址參數 (Query) 測試版
// =========================================================
router.get('/keys/list', requireJwtAuth, async (req, res) => {
    const courseId = req.query.courseID || req.query.course_id;
    if (!courseId) return res.status(400).json({ detail: '缺少 courseID 參數' });

    try {
        // 🌟 改變策略：直接將 courseID 接在網址最後面
        const targetUrl = `${EXTERNAL_API_URL}/keys/list?course_id=${courseId}`;
        console.log(`   ⏳ 正在向外部系統查詢課程用量 (GET Query): ${targetUrl}`);

        const response = await axios.request({
            method: 'GET',
            url: targetUrl,
            headers: { 
                'Authorization': `Bearer ${LITELLM_KEY}`,
                'Accept': 'application/json' 
                // 💡 已經沒有 Body 了，所以不需要 Content-Type
            }
            // 🚨 這裡的 data: { courseID: courseId } 已經徹底刪除！
        });

        console.log(`   ✅ 外部系統查詢成功！`);
        return res.json(response.data);

    } catch (err) {
        if (err.response) {
            console.error(`   ❌ 外部系統查詢失敗: HTTP ${err.response.status}`);
            console.error(JSON.stringify(err.response.data, null, 2)); 
            return res.status(err.response.status).json(err.response.data);
        }
        console.error('❌ 轉發查詢請求時發生錯誤:', err.message);
        res.status(500).json({ error: '無法取得即時用量資料' });
    }
});
export default router;