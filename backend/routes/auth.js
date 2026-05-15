import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Store for in-memory session (in production, use Redis or database)
const userSessions = new Map();

/**
 * POST /api/auth/google
 * 驗證 Google id_token 並建立 session
 */
router.post('/google', async (req, res, next) => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ error: 'Missing id_token' });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const userId = payload.sub;
    const user = {
      id: userId,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };

    // Create session
    req.session.userId = userId;
    req.session.user = user;

    // Also store in memory for quick access (optional)
    userSessions.set(userId, {
      ...user,
      loginAt: new Date(),
      idToken: id_token
    });

    // Generate JWT token for optional use
    const token = jwt.sign(
      { userId, email: payload.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user,
      token
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
 * GET /api/auth/session
 * 取得現有登入狀態
 */
router.get('/session', (req, res) => {
  if (req.session.userId && req.session.user) {
    res.json({
      user: req.session.user
    });
  } else {
    res.json({
      user: null
    });
  }
});

/**
 * POST /api/auth/logout
 * 清除 session
 */
router.post('/logout', (req, res, next) => {
  const userId = req.session.userId;

  // 移除記憶體中的 session
  if (userId) {
    userSessions.delete(userId);
  }

  // 清除 session
  req.session.destroy((err) => {
    if (err) {
      return next({
        status: 500,
        message: 'Failed to clear session'
      });
    }

    // Clear session cookie
    res.clearCookie('connect.sid');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

/**
 * Middleware: 驗證是否已登入
 */
export const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

/**
 * GET /api/auth/user (protected)
 * 取得當前使用者資訊
 */
router.get('/user', requireAuth, (req, res) => {
  res.json({
    user: req.session.user
  });
});

export default router;
