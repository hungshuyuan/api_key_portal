import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import pkg from '@prisma/client';
import { requireJwtAuth } from './auth.js'; // 引入你在 auth.js 寫好的驗證中介軟體

const { PrismaClient } = pkg;
const router = express.Router();
const prisma = new PrismaClient();

// 環境變數設定
const LITELLM_API_URL = process.env.LITELLM_API_URL;
const LITELLM_MANAGE_KEY = process.env.LITELLM_MANAGE_KEY;

// ==========================================
// 加解密模組 (保護存入本地 DB 的 Raw Key)
// ==========================================
// 確保 process.env.ENCRYPTION_KEY 是一串有效的 base64 且解出來為 32 bytes
const ENCRYPTION_KEY = Buffer.from(
    process.env.ENCRYPTION_KEY.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
);
const IV_LENGTH = 16;

function encryptKey(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptKey(text) {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const getLitellmHeaders = () => ({
  'Authorization': `Bearer ${LITELLM_MANAGE_KEY}`,
  'Content-Type': 'application/json'
});

// ==========================================
// 1. 取得 Key 列表與用量
// ==========================================
router.get('/', requireJwtAuth, async (req, res) => {
  const student_id = req.user.student_id;

  try {
    // 1. 從學長端撈該學號的所有 Key 用量資料
    const liteRes = await axios.get(`${LITELLM_API_URL}/user/info?user_id=${student_id}`, {
      headers: getLitellmHeaders()
    });
    
    const userInfo = liteRes.data.user_info || {};
    const litellmKeys = liteRes.data.keys || [];
    const userTotalSpend = userInfo.spend || 0.0;
    const maxBudget = userInfo.max_budget || 100.0;
    const budgetDuration = userInfo.budget_duration || 'N/A';
    const budgetResetAt = userInfo.budget_reset_at || null;

    // 2. 從本地 Prisma DB 撈自己申請的 key (過濾掉非此系統產生的 key)
    const dbRecords = await prisma.api_keys.findMany({
      where: { student_id: student_id }
    });
    
    const aliasToId = {};
    dbRecords.forEach(r => aliasToId[r.key_alias] = r.id);

    // 3. 交叉比對並合併資料回傳給前端
    const result = [];
    for (let k of litellmKeys) {
      const alias = k.key_alias || '';
      const db_id = aliasToId[alias];
      
      // 只回傳存在於本地 DB 的金鑰
      if (db_id !== undefined) {
        result.push({
          id: db_id,
          key_name: k.key_name || `${alias.substring(0, 5)}...`,
          key_alias: alias,
          spend: k.spend || 0.0,
          user_total_spend: userTotalSpend,
          max_budget: maxBudget,
          budget_duration: budgetDuration,
          budget_reset_at: budgetResetAt
        });
      }
    }

    res.json(result);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // 如果 LiteLLM 尚未建立該用戶，回傳空陣列是正常的
      return res.json([]);
    }
    console.error('取得列表失敗:', error.message);
    res.status(502).json({ detail: '無法取得用量資訊' });
  }
});

// ==========================================
// 2. 申請產生新 Key
// ==========================================
router.post('/generate', requireJwtAuth, async (req, res) => {
  const student_id = req.user.student_id;
  const timestamp = Math.floor(Date.now() / 1000);
  const key_alias = `${student_id}_${timestamp}`;

  try {
    // 1. 向學長端 API 申請產生 Key
    const liteRes = await axios.post(`${LITELLM_API_URL}/key/generate`, {
      user_id: student_id,
      key_alias: key_alias,
      key_type: "llm_api"
    }, { headers: getLitellmHeaders() });

    const raw_key = liteRes.data.key;
    if (!raw_key) throw new Error("外部 API 未回傳金鑰");

    // 2. 使用 AES-256 加密原始金鑰
    const encryptedKey = encryptKey(raw_key);

    // 3. 存入本地 Prisma 資料庫
    await prisma.api_keys.create({
      data: {
        student_id: student_id,
        key_alias: key_alias,
        encrypted_raw_key: encryptedKey
      }
    });

    res.json({ message: '申請成功', key: raw_key });

  } catch (error) {
    console.error('申請金鑰失敗:', error.response?.data || error.message);
    res.status(500).json({ detail: '申請金鑰失敗' });
  }
});

// ==========================================
// 3. 註銷/刪除 Key
// ==========================================
router.delete('/:id', requireJwtAuth, async (req, res) => {
  const key_id = parseInt(req.params.id);
  const student_id = req.user.student_id;

  try {
    // 1. 檢查資料庫是否存在該 Key，且確實屬於當前登入者
    const record = await prisma.api_keys.findFirst({
      where: { id: key_id, student_id: student_id }
    });

    if (!record) return res.status(404).json({ detail: '找不到此 API Key 或無權限' });

    // 2. 通知學長端刪除該金鑰
    await axios.post(`${LITELLM_API_URL}/key/delete`, {
      key_aliases: [record.key_alias]
    }, { headers: getLitellmHeaders() });

    // 3. 從本地資料庫刪除紀錄
    await prisma.api_keys.delete({
      where: { id: key_id }
    });

    res.json({ message: '註銷成功' });
  } catch (error) {
    console.error('註銷金鑰失敗:', error.response?.data || error.message);
    res.status(500).json({ detail: '註銷失敗，請稍後再試' });
  }
});

// ==========================================
// 4. 查看 Key 明文 (Reveal)
// ==========================================
router.get('/:id/reveal', requireJwtAuth, async (req, res) => {
  const key_id = parseInt(req.params.id);
  const student_id = req.user.student_id;

  try {
    // 確認所有權
    const record = await prisma.api_keys.findFirst({
      where: { id: key_id, student_id: student_id }
    });

    if (!record || !record.encrypted_raw_key) {
      return res.status(404).json({ detail: '找不到此 API Key 或無權限' });
    }

    // 解密並回傳
    const raw_key = decryptKey(record.encrypted_raw_key);
    res.json({ raw_key: raw_key });
  } catch (error) {
    console.error('解密失敗:', error.message);
    res.status(500).json({ detail: '解密發生錯誤' });
  }
});

export default router;