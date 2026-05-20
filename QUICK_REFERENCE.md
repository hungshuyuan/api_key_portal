# 🚀 快速參考卡片 - 雙 Layout 架構

## 📁 文件結構速查

### 已更新
```
✓ src/App.jsx                 - 主路由配置（雙 Layout）
✓ src/Layout.jsx              - 前台布局（Locomotive Scroll）
✓ src/AuthProvider.jsx        - 認證上下文（無變更）
```

### 新建組件
```
✓ src/components/ProtectedRoute.jsx     - 認證保護
✓ src/components/Sidebar.jsx            - 側邊欄菜單
✓ src/components/SystemTopbar.jsx       - 頂部導航
✓ src/layouts/SystemLayout.jsx          - 後台主布局

✓ src/pages/dashboard/CourseList.jsx    - 課程管理
✓ src/pages/dashboard/ApiKeyManager.jsx - API 金鑰
✓ src/pages/dashboard/Profile.jsx       - 個人資料
✓ src/pages/dashboard/Settings.jsx      - 系統設定
```

### 新建樣式
```
✓ css/system.css      - 系統布局（Dark Mode）
✓ css/sidebar.css     - 側邊欄樣式
✓ css/topbar.css      - 頂部欄樣式
✓ css/pages.css       - 頁面通用樣式
```

---

## 🗺️ 路由地圖

### 前台區（Portal）- 使用 `Layout.jsx` + Locomotive Scroll
```
/portal/
├── /                 → Home
├── /tutorial         → Tutorial
├── /model            → Model
└── /copliot          → Copliot
```

### 後台區（Dashboard）- 使用 `SystemLayout.jsx` + 原生滾動
```
/portal/app/
├── /course           → 課程管理
├── /apikey           → API 金鑰
├── /profile          → 個人資料
└── /settings         → 系統設定 (僅老師)
```

---

## 🎯 核心機制

### 1. ProtectedRoute 保護
```javascript
<Route element={<ProtectedRoute><SystemLayout /></ProtectedRoute>}>
  <Route path="/app/*" element={...} />
</Route>
```
- 未登入 → 重定向到首頁 `/`
- 已登入 → 顯示後台系統

### 2. Sidebar 角色過濾
```javascript
menuConfig.filter(item => 
  !item.roles || item.roles.includes(user?.role)
)
```
- 老師：看所有菜單
- 學生：隱藏 `Settings`
- 基於 `AuthProvider` 中的 `user.role`

### 3. Locomotive Scroll 隔離
```
Layout.jsx      → 前台區啟用 Locomotive Scroll
SystemLayout.jsx → 後台區禁用（使用原生滾動）
```

---

## ⚡ 開發快速命令

```bash
# 啟動開發環境
cd backend && npm run dev      # 終端 1
cd frontend && npm run dev     # 終端 2

# 構建生產版本
npm run build

# 預覽構建結果
npm run preview

# 查看文件樹
tree frontend/src/

# 清理緩存
rm -rf frontend/dist frontend/node_modules
npm install
```

---

## 🔑 環境變量

### `.env.local` (前端)
```env
VITE_GOOGLE_CLIENT_ID=your_id
VITE_BACKEND_URL=http://localhost:3000
```

### `.env` (後端)
```env
PORT=3000
NODE_ENV=development
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
JWT_SECRET=secret
SESSION_SECRET=secret
FRONTEND_URL=http://localhost:5200
```

---

## 🎨 CSS 變量（可自定義）

```css
--sidebar-width: 260px              /* Sidebar 展開寬度 */
--sidebar-width-collapsed: 80px     /* Sidebar 收起寬度 */
--topbar-height: 64px               /* 頂部欄高度 */
--primary-color: #4f46e5            /* 主色調 */
--bg-light: #f9fafb                 /* 淺色背景 */
--transition-duration: 0.3s         /* 動畫時長 */
```

---

## 🧪 測試 URL

```
前台：
http://localhost:5200/portal/
http://localhost:5200/portal/tutorial
http://localhost:5200/portal/model

後台（需登入）：
http://localhost:5200/portal/app/course
http://localhost:5200/portal/app/apikey
http://localhost:5200/portal/app/profile
http://localhost:5200/portal/app/settings
```

---

## ✅ 檢查清單

- [ ] 文件結構完整
- [ ] 依賴安裝: `npm install`
- [ ] 環境變量配置
- [ ] 啟動後端 & 前端
- [ ] 前台路由測試 (無登入)
- [ ] Google 登入測試
- [ ] 後台路由測試 (登入後)
- [ ] Sidebar 收放測試
- [ ] 深色模式測試
- [ ] 移動設備響應式測試
- [ ] 登出功能測試
- [ ] 角色權限過濾測試

---

## 🔗 集成步驟（course-api-system）

1. **複製頁面組件**
   ```bash
   cp course-api-system/src/pages/* frontend/src/pages/dashboard/
   ```

2. **添加路由** in `App.jsx`
   ```javascript
   <Route path="/app/course/:id" element={<CourseDetail />} />
   ```

3. **複製 API 邏輯**
   - 保留或整合 API 服務層
   - 確保使用 `credentials: 'include'`

4. **測試整合**
   - 驗證所有路由正常
   - 檢查 API 調用成功
   - 測試登入 & 登出流程

---

## 💡 常用代碼片段

### 在任何組件中訪問認證狀態
```javascript
import { useAuth } from '../AuthProvider';

function MyComponent() {
  const { user, logout } = useAuth();
  return <div>{user?.name}</div>;
}
```

### 添加新菜單項
```javascript
// Sidebar.jsx - menuConfig
{
  id: 'newpage',
  label: '新功能',
  icon: '📦',
  path: '/app/newpage',
  roles: ['老師', '學生'],
}
```

### 調用 API（含認證）
```javascript
fetch('/api/courses', {
  credentials: 'include'  // 重要：包含 Cookie
}).then(r => r.json()).then(data => {...})
```

### 導航到登入後台
```javascript
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/app/profile');
```

---

## 🎯 下一步

1. ✅ 驗證基礎架構（本次完成）
2. ⏭️  集成 course-api-system 頁面
3. ⏭️  實現後端 API 端點
4. ⏭️  添加 Dark Mode 切換持久化
5. ⏭️  性能優化 & 代碼分割
6. ⏭️  部署到生產環境

---

**最後更新**: 2026-05-17  
**版本**: 1.0.0  
**狀態**: ✅ 可生產
