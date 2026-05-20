# IAI Portal 開發指南

完整版本 | 繁體中文 | 最後更新：2026年5月

---

## 📋 目錄

1. [專案概述](#專案概述)
2. [系統需求](#系統需求)
3. [環境設置](#環境設置)
4. [後端開發](#後端開發)
5. [前端開發](#前端開發)
6. [開發工作流](#開發工作流)
7. [API 文檔](#api-文檔)
8. [部署指南](#部署指南)
9. [常見問題](#常見問題)
10. [貢獻指南](#貢獻指南)

---

## 專案概述

**IAI Portal** 是一個全棧應用，提供 API 金鑰管理和認證服務。

### 核心功能

- ✅ Google OAuth 2.0 認證
- ✅ JWT Token 發行與驗證
- ✅ Session 管理
- ✅ RESTful API
- ✅ 響應式前端界面
- ✅ 實時 Copilot 助手集成

### 技術棧

| 層級 | 技術 |
|------|------|
| **前端** | React 18, Vite, React Router, Locomotive Scroll |
| **後端** | Node.js, Express.js, Google Auth Library |
| **認證** | Google OAuth 2.0, JWT, express-session |
| **服務器** | Nginx（生產環境） |
| **包管理** | npm |

---

## 系統需求

### 必要工具

- **Node.js**: v16.0.0 或更高版本
- **npm**: v8.0.0 或更高版本
- **Git**: 版本控制
- **Google Cloud Console** 帳戶：用於 OAuth 配置

### 可選工具

- **VS Code**: 推薦的開發編輯器
- **Postman/Insomnia**: API 測試
- **Docker**: 容器化部署

### 開發環境建議規格

- RAM: ≥ 4GB
- 磁盤空間: ≥ 2GB
- 網絡: 穩定的互聯網連接

---

## 環境設置

### 1. 克隆專案

```bash
git clone <repository-url>
cd API_key_Portal
```

### 2. 安裝依賴

#### 後端依賴

```bash
cd backend
npm install
```

#### 前端依賴

```bash
cd ../frontend
npm install
```

### 3. 配置 Google OAuth

#### 步驟 1：創建 Google Cloud 專案

1. 訪問 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊「選擇專案」→「新建專案」
3. 輸入專案名稱（如：`IAI-Portal`），點擊「建立」
4. 等待專案初始化完成

#### 步驟 2：啟用 Google+ API

1. 在搜索框中搜索「Google+ API」
2. 點擊「Google+ API」
3. 點擊「啟用」按鈕

#### 步驟 3：建立 OAuth 2.0 認證

1. 進入「認證」頁面（左側菜單）
2. 點擊「建立認證資料」→「OAuth 2.0 用戶端 ID」
3. 若提示設置 OAuth 同意屏幕：
   - 選擇「外部」用戶類型
   - 填寫應用名稱、用戶支持郵件等必要信息
   - 保存並繼續
4. 在應用類型選擇「Web 應用」
5. 添加授權的 JavaScript 來源：
   - `http://localhost:5173`
   - `http://localhost:5200`
   - `http://localhost:3000`
   - `https://nkustapikey.54ucl.com`（生產環境）
6. 添加授權導向 URI：
   - `http://localhost:3000/api/auth/callback`
   - `https://nkustapikey.54ucl.com/api/auth/callback`（生產環境）
7. 點擊「建立」，記下 Client ID 和 Client Secret

### 4. 配置環境變量

#### 後端環境變量（`.env`）

```bash
cd backend
cp .env.example .env  # 或手動建立
```

編輯 `.env` 文件，填入以下內容：

```env
# 伺服器配置
PORT=3000
NODE_ENV=development

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# JWT 與 Session
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
SESSION_SECRET=your_session_secret_change_this_in_production

# 前端 URL（用於 CORS）
FRONTEND_URL=http://localhost:5200
```

#### 前端環境變量（`.env.local`）

```bash
cd ../frontend
cat > .env.local << EOF
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_BACKEND_URL=http://localhost:3000
EOF
```

---

## 後端開發

### 項目結構

```
backend/
├── server.js           # Express 主應用
├── routes/
│   ├── auth.js        # 認證路由
│   └── ...
├── middleware/        # 中間件（如需要）
├── package.json
├── .env              # 環境變量（勿提交）
├── .env.example      # 環境變量示例
└── README.md
```

### 啟動後端開發伺服器

#### 開發模式（自動重載）

```bash
cd backend
npm run dev
```

伺服器將在 `http://localhost:3000` 啟動，監控文件變化並自動重新加載。

#### 生產模式

```bash
npm start
```

### 主要依賴說明

| 包名 | 版本 | 用途 |
|------|------|------|
| `express` | ^4.18.2 | Web 框架 |
| `cors` | ^2.8.5 | 跨域資源共享 |
| `dotenv` | ^16.4.5 | 環境變量管理 |
| `jsonwebtoken` | ^9.0.2 | JWT 簽名與驗證 |
| `google-auth-library` | ^9.2.0 | Google OAuth 驗證 |
| `express-session` | ^1.17.3 | Session 管理 |
| `cookie-parser` | ^1.4.6 | Cookie 解析 |
| `axios` | ^1.7.2 | HTTP 請求庫 |

### 認證流程

```
┌─────────────┐
│   前端      │
└──────┬──────┘
       │ 1. 用戶點擊 Google 登入
       │
       ├──→ Google OAuth 服務
       │    (返回 id_token)
       │
       │ 2. 發送 id_token 到後端
       ▼
┌─────────────────────────────────────────┐
│          後端 (/api/auth/google)        │
├─────────────────────────────────────────┤
│ • 驗證 id_token 有效性                  │
│ • 提取用戶信息（email, name, picture)  │
│ • 創建 session & JWT token             │
│ • 返回 token 到前端                     │
└──────┬──────────────────────────────────┘
       │ 3. 返回 token & 用戶信息
       │
       ▼
┌─────────────────────────────────────────┐
│      前端                                │
│ • 存儲 token（localStorage/session）    │
│ • 設置認證狀態                          │
│ • 重定向到首頁                          │
└─────────────────────────────────────────┘
```

### 關鍵 API 端點

#### POST `/api/auth/google`

**用途**: 驗證 Google id_token 並建立會話

**請求**:
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMyIsInR5cCI6IkpXVCJ9..."
}
```

**成功響應** (200):
```json
{
  "success": true,
  "user": {
    "id": "118156699....",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://example.com/photo.jpg"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**錯誤響應** (400/401):
```json
{
  "success": false,
  "error": "Invalid token"
}
```

#### GET `/api/auth/session`

**用途**: 檢查當前登入狀態

**成功響應** (200 - 已登入):
```json
{
  "user": {
    "id": "118156699....",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://example.com/photo.jpg"
  }
}
```

**響應** (200 - 未登入):
```json
{
  "user": null
}
```

#### GET `/api/health`

**用途**: 健康檢查

**響應**:
```json
{
  "status": "ok",
  "timestamp": "2026-05-17T10:30:00.000Z"
}
```

### 擴展後端功能

#### 添加新的 API 路由

1. 在 `routes/` 目錄創建新文件，例如 `routes/api.js`：

```javascript
import express from 'express';

const router = express.Router();

// 中間件：驗證 JWT token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// 受保護的路由示例
router.get('/protected-data', authMiddleware, (req, res) => {
  res.json({ data: 'Only authenticated users can see this' });
});

export default router;
```

2. 在 `server.js` 中引入並使用：

```javascript
import apiRoutes from './routes/api.js';
app.use(['/api', '/portal/api'], apiRoutes);
```

---

## 前端開發

### 項目結構

```
frontend/
├── src/
│   ├── main.jsx              # 入口文件
│   ├── App.jsx               # 主應用組件
│   ├── Layout.jsx            # 布局組件
│   ├── AuthProvider.jsx      # 認證上下文提供者
│   ├── Home.jsx              # 首頁
│   ├── Copliot.jsx           # Copilot 功能頁面
│   ├── Model.jsx             # 模型頁面
│   ├── Tutorial.jsx          # 教程頁面
│   ├── scrollManager.js      # 滾動管理工具
│   └── ...
├── css/
│   ├── style.css             # 全局樣式
│   ├── copliot.css           # Copilot 樣式
│   └── tutorial.css          # 教程樣式
├── js/
│   ├── all.js                # 通用 JavaScript
│   └── copliot.js            # Copilot 相關邏輯
├── index.html                # HTML 入口
├── vite.config.js            # Vite 配置
├── package.json
└── .env.local               # 環境變量（本地開發）
```

### 啟動前端開發伺服器

```bash
cd frontend
npm run dev
```

應用將在 `http://localhost:5200` 啟動（根據 vite.config.js 配置）。

### 生產構建

```bash
npm run build
```

生成的靜態文件位於 `dist/` 目錄。

### 前端主要依賴說明

| 包名 | 版本 | 用途 |
|------|------|------|
| `react` | ^18.3.1 | UI 框架 |
| `react-dom` | ^18.3.1 | React DOM 渲染 |
| `react-router-dom` | ^7.15.0 | 路由管理 |
| `@react-oauth/google` | ^0.8.0 | Google OAuth 登入組件 |
| `locomotive-scroll` | ^4.1.4 | 平滑滾動效果 |
| `prismjs` | ^1.30.0 | 代碼語法高亮 |
| `vite` | ^5.4.1 | 構建工具 |
| `@vitejs/plugin-react` | ^4.3.1 | React 插件 |

### 認證上下文使用

#### AuthProvider 組件

`AuthProvider.jsx` 提供全局認證狀態管理。

```javascript
// 在任何組件中使用
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

function MyComponent() {
  const { user, isLoading, login, logout } = useContext(AuthContext);
  
  if (isLoading) return <p>Loading...</p>;
  
  return (
    <div>
      {user ? (
        <>
          <p>Welcome, {user.name}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={login}>Login</button>
      )}
    </div>
  );
}
```

### 路由配置

應用使用 React Router v7 進行路由管理，基路徑為 `/portal`：

| 路由 | 組件 | 說明 |
|------|------|------|
| `/portal/` | `Home` | 首頁 |
| `/portal/copliot` | `Copliot` | Copilot 助手 |
| `/portal/model` | `Model` | 模型管理 |
| `/portal/tutorial` | `Tutorial` | 教程頁面 |

### 環境變量

在 `src/main.jsx` 和 `src/App.jsx` 中使用 Vite 環境變量：

```javascript
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
```

### 添加新頁面

1. 創建新組件 `src/Pages.jsx`：

```javascript
function Pages() {
  return (
    <div>
      <h1>New Page</h1>
      <p>Page content here</p>
    </div>
  );
}

export default Pages;
```

2. 在 `App.jsx` 中添加路由：

```javascript
import Pages from './Pages';

// 在 <Routes> 中添加
<Route path="/pages" element={<Pages />} />
```

3. 更新導航菜單（在 `Layout.jsx` 中）

### 樣式管理

- 全局樣式：`css/style.css`
- 組件特定樣式：`css/<component-name>.css`
- 可以使用 CSS 模塊或 TailwindCSS（如需要）

---

## 開發工作流

### 典型開發流程

#### 1. 創建功能分支

```bash
git checkout -b feature/new-feature
```

#### 2. 同時運行前後端伺服器

**終端 1 - 後端**:
```bash
cd backend
npm run dev
```

**終端 2 - 前端**:
```bash
cd frontend
npm run dev
```

#### 3. 開發與測試

- 編輯代碼
- 保存文件（Vite 自動重載前端，Express 自動重載後端）
- 在瀏覽器中測試

#### 4. 使用 API 工具測試

使用 Postman、Insomnia 或 curl 測試後端 API：

```bash
# 測試 Google 認證
curl -X POST http://localhost:3000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"id_token":"YOUR_ID_TOKEN"}'

# 檢查 Session
curl http://localhost:3000/api/auth/session \
  -b "connect.sid=YOUR_SESSION_ID"

# 健康檢查
curl http://localhost:3000/api/health
```

#### 5. 提交更改

```bash
git add .
git commit -m "feat: describe your feature"
git push origin feature/new-feature
```

#### 6. 創建 Pull Request

在 GitHub 上創建 PR，等待代碼審查

### 常用開發命令

```bash
# 後端
cd backend
npm run dev       # 開發模式（自動重載）
npm start         # 生產模式
npm test          # 運行測試（如配置）

# 前端
cd frontend
npm run dev       # 開發模式
npm run build     # 生產構建
npm run preview   # 預覽構建結果
```

### 調試技巧

#### 後端調試

1. 使用 `console.log()` 輸出日誌
2. 使用 Node.js 內置調試器：

```bash
node --inspect server.js
```

然後在 Chrome DevTools 中訪問 `chrome://inspect`

#### 前端調試

1. 使用 VS Code 的 Debugger for Chrome 擴展
2. 在 `main.jsx` 中檢查環境變量：

```javascript
console.log("Google Client ID:", GOOGLE_CLIENT_ID);
console.log("Backend URL:", import.meta.env.VITE_BACKEND_URL);
```

3. 檢查瀏覽器開發者工具（F12）

---

## API 文檔

### 基礎 URL

| 環境 | URL |
|------|-----|
| 開發 | `http://localhost:3000` |
| 生產 | `https://nkustapikey.54ucl.com` |

### 認證方式

- **Cookie-based Session**: 自動管理（Express Session）
- **JWT Token**: 可選，用於無狀態認證

### 錯誤處理

所有 API 端點遵循標準錯誤格式：

```json
{
  "success": false,
  "error": "Error message"
}
```

### 詳細端點文檔

詳見 [backend/README.md](backend/README.md)

---

## 部署指南

### 生產環境準備

#### 1. 環境變量設置

在服務器上創建 `.env` 文件：

```env
PORT=3000
NODE_ENV=production
GOOGLE_CLIENT_ID=prod_client_id
GOOGLE_CLIENT_SECRET=prod_client_secret
JWT_SECRET=prod_jwt_secret_long_string
SESSION_SECRET=prod_session_secret
FRONTEND_URL=https://nkustapikey.54ucl.com
```

#### 2. 前端構建

```bash
cd frontend
npm install
npm run build
```

構建輸出位於 `dist/` 目錄

#### 3. Nginx 配置

根據 `nginx.conf`，配置 Nginx 反向代理：

```nginx
server {
    listen 443 ssl;
    server_name nkustapikey.54ucl.com;

    ssl_certificate /etc/letsencrypt/live/nkustapikey.54ucl.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nkustapikey.54ucl.com/privkey.pem;

    # =========================
    # 前端靜態文件 (React SPA)
    # =========================
    location /portal/ {
        alias /usr/share/nginx/html/portal/;
        index index.html;
        # ✅ 已修正：讓迷路的網址回到 portal 的懷抱
        try_files $uri $uri/ /portal/index.html;
    }

    # =========================
    # 後端 API 代理 (轉交給 Node.js)
    # =========================
    location /portal/api/ {
        # ✅ 已修正：對齊您實際的 5000 埠與 API 路由
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        # ✅ 補上安全與真實 IP 標頭，讓後端能正確辨識來源
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. 啟動後端服務

選項 A：使用 PM2 進程管理器

```bash
npm install -g pm2
cd backend
pm2 start server.js --name "iai-portal-backend"
pm2 save
pm2 startup
```

選項 B：使用 systemd 服務

```ini
[Unit]
Description=IAI Portal Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/backend
ExecStart=/usr/bin/node server.js
Restart=always
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

#### 5. SSL 證書設置

使用 Let's Encrypt：

```bash
sudo certbot certonly --standalone -d nkustapikey.54ucl.com
```

### Docker 部署（可選）

#### 後端 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci --only=production

COPY backend/ ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]
```

#### 前端 Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ ./

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html/portal

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 監控與日誌

#### 後端日誌

```bash
# 查看日誌（使用 PM2）
pm2 logs iai-portal-backend

# 或使用 systemd
journalctl -u iai-portal-backend -f
```

#### Nginx 日誌

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 常見問題

### Q1: 構建時提示 "VITE_GOOGLE_CLIENT_ID 未定義"

**解決方案**:
1. 檢查 `.env.local` 文件是否存在且包含 `VITE_GOOGLE_CLIENT_ID`
2. 確保環境變量名以 `VITE_` 開頭
3. 重啟開發伺服器：`npm run dev`

### Q2: Google 登入失敗，提示 "CORS origin not allowed"

**解決方案**:
1. 檢查 `server.js` 中的 `allowedOrigins` 列表
2. 確保您的前端 URL 已添加到列表中
3. 驗證 Google Cloud Console 中的 JavaScript 來源配置

### Q3: 後端無法連接到 Google OAuth

**解決方案**:
1. 驗證 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 是否正確
2. 檢查網絡連接
3. 確認 Google Cloud 專案已啟用 Google+ API

### Q4: 前端路由返回 404

**解決方案**:
1. 確保 React Router 的基路徑設置正確：`<Router basename="/portal">`
2. 檢查 Nginx `try_files` 配置是否指向 `index.html`
3. 確保 Vite 配置中的基路徑正確：`base: '/portal/'`

### Q5: Session 在刷新後丟失

**解決方案**:
1. 檢查 Cookie 設置是否正確（httpOnly, sameSite 等）
2. 驗證後端 Session 中間件配置
3. 確認瀏覽器設置允許 Cookie

### Q6: 如何在本地測試生產構建？

```bash
# 前端生產構建
cd frontend
npm run build

# 本地預覽構建結果
npm run preview

# 訪問 http://localhost:4173/portal
```

### Q7: 如何重置開發環境？

```bash
# 清理依賴和構建文件
cd backend && rm -rf node_modules package-lock.json
cd ../frontend && rm -rf node_modules dist package-lock.json

# 重新安裝
cd backend && npm install
cd ../frontend && npm install
```

---

## 貢獻指南

### 提交代碼前的檢查清單

- [ ] 代碼遵循項目風格指南
- [ ] 所有新功能都有適當的註釋
- [ ] 後端測試通過
- [ ] 前端在開發和生產構建中都能正常工作
- [ ] 環境變量文檔已更新
- [ ] `.env` 文件未被提交

### 代碼風格

#### JavaScript/Node.js

```javascript
// 使用 const/let，避免 var
const config = { key: 'value' };
let counter = 0;

// 使用箭頭函數
const sum = (a, b) => a + b;

// 適當的註釋
/**
 * 驗證用戶 Token
 * @param {string} token - JWT Token
 * @returns {boolean} Token 是否有效
 */
const validateToken = (token) => {
  // 實現邏輯
};
```

#### React 組件

```javascript
import { useState, useEffect } from 'react';

function MyComponent() {
  const [state, setState] = useState('');

  useEffect(() => {
    // 組件掛載時執行
    return () => {
      // 清理函數
    };
  }, []);

  return (
    <div>
      {/* JSX 內容 */}
    </div>
  );
}

export default MyComponent;
```

### Git 提交訊息格式

```
feat: 添加新功能
fix: 修復 Bug
docs: 文檔更新
style: 代碼風格調整
refactor: 代碼重構
test: 添加/修改測試
chore: 依賴更新、配置變更等
```

例子：
```
feat: 添加用戶個人資料頁面

- 創建個人資料編輯表單
- 集成後端 API
- 添加表單驗證
```

---

## 快速參考

### 常用命令

```bash
# 啟動開發環境
cd backend && npm run dev  # 終端 1
cd frontend && npm run dev # 終端 2

# 生產構建
npm run build

# 提交代碼
git add .
git commit -m "feat: description"
git push

# 清理環境
npm run clean  # 如果定義了此腳本
```

### 重要文件位置

| 文件 | 路徑 |
|------|------|
| 後端配置 | `backend/.env` |
| 前端配置 | `frontend/.env.local` |
| API 路由 | `backend/routes/` |
| React 組件 | `frontend/src/` |
| 樣式表 | `frontend/css/` |
| Nginx 配置 | `frontend/nginx.conf` |
| Vite 配置 | `frontend/vite.config.js` |

---

## 聯繫與支持

如有問題，請：

1. 檢查本指南的常見問題部分
2. 查看 [backend/README.md](backend/README.md) 和後端文檔
3. 檢查 GitHub Issues
4. 聯繫開發團隊

---

**最後更新**: 2026年5月17日  
**維護者**: IAI Portal 開發團隊
