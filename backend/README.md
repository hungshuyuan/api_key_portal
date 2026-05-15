# IAI Portal Backend

Node.js/Express 後端服務，提供 Google OAuth 認證 API。

## 🚀 快速開始

### 1. 安裝依賴

```bash
cd backend
npm install
```

### 2. 環境設定

複製 `.env.example` 為 `.env` 並填入設定值：

```bash
cp .env.example .env
```

編輯 `.env` 檔案：

```env
PORT=3000
NODE_ENV=development
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
FRONTEND_URL=http://localhost:5173
```

**如何取得 Google Client ID:**
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 Google+ API
4. 建立 OAuth 2.0 認證（Web 應用程式）
5. 設定授權導向 URI: `http://localhost:3000/api/auth/callback` (本地開發)
6. 複製 Client ID 和 Client Secret

### 3. 啟動伺服器

開發模式（自動重載）：
```bash
npm run dev
```

生產模式：
```bash
npm start
```

伺服器將在 `http://localhost:3000` 啟動。

## 📍 API 端點

### 1. Google OAuth 驗證
**POST** `/api/auth/google`

**請求:**
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMyIsInR5cCI6IkpXVCJ9..."
}
```

**回應:**
```json
{
  "success": true,
  "user": {
    "id": "118156699....",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. 取得 Session 狀態
**GET** `/api/auth/session`

**回應 (已登入):**
```json
{
  "user": {
    "id": "118156699....",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://..."
  }
}
```

**回應 (未登入):**
```json
{
  "user": null
}
```

### 3. 登出
**POST** `/api/auth/logout`

**回應:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 4. 健康檢查
**GET** `/api/health`

**回應:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-15T10:30:00.000Z"
}
```

### 5. 取得使用者資訊 (受保護)
**GET** `/api/auth/user`

需要有效的 session。

**回應:**
```json
{
  "user": {
    "id": "118156699....",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://..."
  }
}
```

## 🔐 功能

- ✅ Google OAuth 2.0 token 驗證
- ✅ Express session 管理
- ✅ JWT token 簽發（可選用於移動應用）
- ✅ CORS 設定
- ✅ Cookie-based session
- ✅ HTTP-only 安全 cookie
- ✅ 自動 session 過期（7 天）

## 📝 環境變數

| 變數 | 說明 | 範例 |
|------|------|------|
| `PORT` | 伺服器埠號 | `3000` |
| `NODE_ENV` | 環境 | `development` \| `production` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | `GOCSPX-xxx` |
| `JWT_SECRET` | JWT 簽名密鑰 | 隨機字串 |
| `SESSION_SECRET` | Session 密鑰 | 隨機字串 |
| `FRONTEND_URL` | 前端 URL | `http://localhost:5173` |

## 🔧 Nginx 代理設定

在前端的 `nginx.conf` 中加入：

```nginx
location /api/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

## 📦 依賴

- `express` - Web 框架
- `cors` - CORS 支援
- `dotenv` - 環境變數管理
- `jsonwebtoken` - JWT 生成和驗證
- `axios` - HTTP 客戶端
- `express-session` - Session 管理
- `cookie-parser` - Cookie 解析
- `google-auth-library` - Google OAuth 驗證

## 🚀 生產部署

1. 設定 `.env` 生產變數
2. 設定 `NODE_ENV=production`
3. 使用 PM2 或 Docker 管理進程
4. 設定 Nginx 反向代理
5. 使用 HTTPS（推薦）

## 📋 待辦

- [ ] 使用 Redis 替代記憶體存儲 session
- [ ] 資料庫整合（PostgreSQL/MongoDB）
- [ ] 記錄日誌系統
- [ ] 速率限制
- [ ] 操作審計
- [ ] 刷新 token 機制
