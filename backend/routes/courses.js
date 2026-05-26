import express from 'express';
import pkg from 'pg';
import { requireJwtAuth } from './auth.js';

const { Pool } = pkg;
const router = express.Router();

// 建立 PostgreSQL 連線池 (對應你的 SSH Tunnel 設定)
const pool = new Pool({
  user: process.env.PGUSER || 'llmproxy',
  host: process.env.PGHOST || '127.0.0.1',
  database: process.env.PGDATABASE || 'aiserver',
  password: process.env.PGPASSWORD || 'W4WDKwQ4e2U2K6Su',
  port: process.env.PGPORT || 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('無法連接到 PostgreSQL 資料庫:', err.message);
  } else {
    console.log('✅ 學生 API 已成功連線至 PostgreSQL (aiserver)');
    release();
  }
});

const getStudentIdFromReq = (req) => req.jwtPayload?.student_id || req.jwtPayload?.userId;

router.get('/', requireJwtAuth, async (req, res) => {
  const studentId = getStudentIdFromReq(req);
  if (!studentId) {
    return res.status(401).json({ error: 'Missing student identity from token' });
  }

  try {
    const result = await pool.query(
      'SELECT id, course_id, student_id, student_name, key_alias, max_budget, created_at FROM student_keys WHERE student_id = $1 AND key_value IS NOT NULL',
      [studentId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('查詢金鑰列表失敗:', err.message);
    res.status(500).json({ error: 'Failed to fetch keys' });
  }
});

router.delete('/:key_id', requireJwtAuth, async (req, res) => {
  const studentId = getStudentIdFromReq(req);
  const keyId = parseInt(req.params.key_id, 10);

  if (!studentId) {
    return res.status(401).json({ error: 'Missing student identity from token' });
  }
  if (Number.isNaN(keyId)) {
    return res.status(400).json({ error: 'Invalid key_id' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM student_keys WHERE id = $1 AND student_id = $2 RETURNING id',
      [keyId, studentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Key not found or not owned by this student' });
    }

    res.json({ message: '註銷成功' });
  } catch (err) {
    console.error('刪除金鑰失敗:', err.message);
    res.status(500).json({ error: 'Failed to delete key' });
  }
});

router.get('/:key_id/reveal', requireJwtAuth, async (req, res) => {
  const studentId = getStudentIdFromReq(req);
  const keyId = parseInt(req.params.key_id, 10);

  if (!studentId) {
    return res.status(401).json({ error: 'Missing student identity from token' });
  }
  if (Number.isNaN(keyId)) {
    return res.status(400).json({ error: 'Invalid key_id' });
  }

  try {
    const result = await pool.query(
      'SELECT key_value FROM student_keys WHERE id = $1 AND student_id = $2',
      [keyId, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Key not found or not owned by this student' });
    }
    
    res.json({ raw_key: result.rows[0].key_value });
  } catch (err) {
    console.error('查詢金鑰失敗:', err.message);
    res.status(500).json({ error: 'Failed to reveal key' });
  }
});

export default router;