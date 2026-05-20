import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireJwtAuth } from './auth.js';

const router = express.Router();
const sql3 = sqlite3.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../管理學院_courses.db');
const db = new sql3.Database(dbPath, (err) => {
  if (err) {
    console.error('無法連接到 SQLite 資料庫:', err.message);
  }
});

const getStudentIdFromReq = (req) => req.jwtPayload?.student_id || req.jwtPayload?.userId;

router.get('/', requireJwtAuth, (req, res) => {
  const studentId = getStudentIdFromReq(req);
  if (!studentId) {
    return res.status(401).json({ error: 'Missing student identity from token' });
  }

  db.all(
    'SELECT id, course_id, student_id, student_name, key_alias, max_budget, created_at FROM student_keys WHERE student_id = ? AND key_value IS NOT NULL',
    [studentId],
    (err, rows) => {
      if (err) {
        console.error('查詢金鑰列表失敗:', err.message);
        return res.status(500).json({ error: 'Failed to fetch keys' });
      }
      res.json(rows || []);
    }
  );
});

router.delete('/:key_id', requireJwtAuth, (req, res) => {
  const studentId = getStudentIdFromReq(req);
  const keyId = parseInt(req.params.key_id, 10);

  if (!studentId) {
    return res.status(401).json({ error: 'Missing student identity from token' });
  }
  if (Number.isNaN(keyId)) {
    return res.status(400).json({ error: 'Invalid key_id' });
  }

  db.get('SELECT id FROM student_keys WHERE id = ? AND student_id = ?', [keyId, studentId], (err, row) => {
    if (err) {
      console.error('查詢金鑰失敗:', err.message);
      return res.status(500).json({ error: 'Failed to delete key' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Key not found or not owned by this student' });
    }

    db.run('DELETE FROM student_keys WHERE id = ?', [keyId], function (deleteErr) {
      if (deleteErr) {
        console.error('刪除金鑰失敗:', deleteErr.message);
        return res.status(500).json({ error: 'Failed to delete key' });
      }
      res.json({ message: '註銷成功' });
    });
  });
});

router.get('/:key_id/reveal', requireJwtAuth, (req, res) => {
  const studentId = getStudentIdFromReq(req);
  const keyId = parseInt(req.params.key_id, 10);

  if (!studentId) {
    return res.status(401).json({ error: 'Missing student identity from token' });
  }
  if (Number.isNaN(keyId)) {
    return res.status(400).json({ error: 'Invalid key_id' });
  }

  db.get(
    'SELECT key_value FROM student_keys WHERE id = ? AND student_id = ?',
    [keyId, studentId],
    (err, row) => {
      if (err) {
        console.error('查詢金鑰失敗:', err.message);
        return res.status(500).json({ error: 'Failed to reveal key' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Key not found or not owned by this student' });
      }
      res.json({ raw_key: row.key_value });
    }
  );
});

export default router;
