import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';

// 引入你的路由 (記得檔案副檔名要加 .js)
import authRoutes from './routes/auth.js';
import keyRoutes from './routes/keys.js';
import courseRoutes from './routes/courses.js';


const app = express();
const PORT = process.env.PORT || 8000;

// --- CORS 網域設定 ---
const getOriginFromEnv = (env) => {
  if (!env) return null;
  try {
    return new URL(env).origin;
  } catch (e) {
    return env;
  }
};

const envFrontOrigin = getOriginFromEnv(process.env.FRONTEND_URL);
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5200',
  'https://nkustapikey.54ucl.com',
  envFrontOrigin
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // 允許沒有 origin 的請求 (例如 Postman) 或在白名單內的網域
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS origin not allowed'));
    }
  },
  credentials: true
}));

// --- Middleware 解析設定 ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Session 設定 ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// --- API 路由掛載 ---
app.get(['/api/health', '/portal/api/health'], (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 掛載 Auth、Keys 與 Courses 路由
app.use(['/api/auth', '/auth', '/portal/api/auth', '/portal/auth'], authRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/courses', courseRoutes);

// --- 錯誤處理 (Error Handling) ---
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// --- 啟動伺服器 ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});