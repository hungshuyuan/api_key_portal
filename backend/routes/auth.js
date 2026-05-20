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
    const { Token, id_token } = req.body;
    const tokenToVerify = Token || id_token;

    if (!tokenToVerify) {
      return res.status(400).json({ error: 'Missing Token or id_token' });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenToVerify,
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
      idToken: tokenToVerify
    });

    // Generate JWT token for optional use
    const token = jwt.sign(
      { student_id: userId, email: payload.email,name: payload.name },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    req.session.jwtToken = token;

    res.json({
      success: true,
      user,
      access_token: token,
      token,
      student_id: userId
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
 * 取得當前使用者資訊
 */
router.get('/user', requireJwtAuth, (req, res) => {
  res.json({
    user: {
      student_id: req.user.student_id, // 這裡也改成 req.user
      email: req.user.email,
      name: req.user.name
    }
  });
});

export default router;
