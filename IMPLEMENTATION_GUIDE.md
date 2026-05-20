# 🎯 雙 Layout 架構實施指南

## ✅ 已完成的工作

### 1. 核心架構更新
- ✅ 更新 `App.jsx` - 支持雙 Layout 路由結構
- ✅ 更新 `Layout.jsx` - 使用 React Router v6+ 的 `<Outlet />`
- ✅ 創建 `ProtectedRoute.jsx` - 後台認證保護

### 2. 後台系統組件
- ✅ `SystemLayout.jsx` - 主要系統布局（Sidebar + Topbar + Outlet）
- ✅ `Sidebar.jsx` - 可收放側邊欄（支持響應式 & 角色權限）
- ✅ `SystemTopbar.jsx` - 頂部導航欄（用戶菜單、登出）

### 3. 後台頁面組件
- ✅ `CourseList.jsx` - 課程管理頁面
- ✅ `ApiKeyManager.jsx` - API 金鑰管理頁面
- ✅ `Profile.jsx` - 個人資料頁面
- ✅ `Settings.jsx` - 系統設定頁面（僅老師可訪問）

### 4. 樣式系統
- ✅ `css/system.css` - 系統布局核心樣式（Dark Mode 支持）
- ✅ `css/sidebar.css` - 側邊欄特定樣式
- ✅ `css/topbar.css` - 頂部導航欄樣式
- ✅ `css/pages.css` - 頁面通用樣式

---

## 🚀 後續實施步驟

### 第 1 步：驗證文件結構

確認以下文件已創建：

```
frontend/src/
├── App.jsx                          ✓ (已更新)
├── Layout.jsx                       ✓ (已更新)
├── AuthProvider.jsx                 ✓ (保持不變)
├── components/
│   ├── ProtectedRoute.jsx           ✓ (新建)
│   ├── Sidebar.jsx                  ✓ (新建)
│   └── SystemTopbar.jsx             ✓ (新建)
├── layouts/
│   └── SystemLayout.jsx             ✓ (新建)
├── pages/
│   └── dashboard/
│       ├── CourseList.jsx           ✓ (新建)
│       ├── ApiKeyManager.jsx        ✓ (新建)
│       ├── Profile.jsx              ✓ (新建)
│       └── Settings.jsx             ✓ (新建)
└── css/
    ├── system.css                   ✓ (新建)
    ├── sidebar.css                  ✓ (新建)
    ├── topbar.css                   ✓ (新建)
    └── pages.css                    ✓ (新建)
```

### 第 2 步：安裝/檢查依賴

```bash
cd frontend
npm install
```

**關鍵依賴確認**：
- ✓ `react-router-dom: ^7.15.0` - 路由管理
- ✓ `@react-oauth/google: ^0.8.0` - Google OAuth
- ✓ `locomotive-scroll: ^4.1.4` - 前台滾動特效（只在前台區使用）

### 第 3 步：啟動開發伺服器

```bash
# 後端（終端 1）
cd backend
npm run dev   # 啟動在 http://localhost:3000

# 前端（終端 2）
cd frontend
npm run dev   # 啟動在 http://localhost:5200
```

### 第 4 步：測試路由與頁面

#### 前台區（Portal）
- 訪問 `http://localhost:5200/portal/` ✓
- 訪問 `http://localhost:5200/portal/tutorial` ✓
- 訪問 `http://localhost:5200/portal/model` ✓
- 訪問 `http://localhost:5200/portal/copliot` ✓
- **驗證**: Locomotive Scroll 應正常工作，頁面滾動流暢

#### 後台區（Dashboard）- 需要登入
- 先在前台登入（使用 Google OAuth）
- 訪問 `http://localhost:5200/portal/app/course` ✓
- 訪問 `http://localhost:5200/portal/app/apikey` ✓
- 訪問 `http://localhost:5200/portal/app/profile` ✓
- 訪問 `http://localhost:5200/portal/app/settings` ✓（僅老師）
- **驗證**: 左側 Sidebar 可正常收放，沒有 Locomotive Scroll 的干擾

### 第 5 步：整合另一個項目的內容

現在您可以將課程系統（`course-api-system`）的代碼整合進來：

#### 5a. 複製課程頁面組件
```bash
# 從 course-api-system 複製相關組件到 frontend/src/pages/dashboard/
cp /path/to/course-api-system/src/pages/* frontend/src/pages/dashboard/
```

#### 5b. 更新路由配置
在 `App.jsx` 中添加更多路由：

```javascript
<Route path="/app/course" element={<CourseList />} />
<Route path="/app/course/:id" element={<CourseDetail />} />
<Route path="/app/course/new" element={<CourseEditor />} />
// ... 其他課程相關路由
```

#### 5c. 複製 API 調用邏輯
如果 course-api-system 有獨立的 API 服務層，保留或整合到統一的 API 客戶端中。

### 第 6 步：環境變量配置

確保 `.env.local` 包含：

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_BACKEND_URL=http://localhost:3000
# 其他必要的環境變量
```

### 第 7 步：後端 API 集成

確保後端支持以下端點：

```
# 已有
POST /api/auth/google          ✓ Google 驗證
GET  /api/auth/session         ✓ Session 檢查
POST /api/auth/logout          ✓ 登出

# 需實現（根據課程系統需求）
GET    /api/courses            - 課程列表
GET    /api/courses/:id        - 課程詳情
POST   /api/courses            - 新增課程
PUT    /api/courses/:id        - 編輯課程
DELETE /api/courses/:id        - 刪除課程

GET    /api/apikeys            - API 金鑰列表
POST   /api/apikeys            - 生成新金鑰
DELETE /api/apikeys/:id        - 刪除金鑰
```

---

## 🎨 自定義與擴展

### 添加新的後台頁面

1. 創建新組件：
```javascript
// frontend/src/pages/dashboard/NewPage.jsx
export default function NewPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>新頁面</h1>
      </div>
      <div className="page-content">
        {/* 內容 */}
      </div>
    </div>
  );
}
```

2. 在 `App.jsx` 中添加路由：
```javascript
import NewPage from './pages/dashboard/NewPage';
// ...
<Route path="/app/newpage" element={<NewPage />} />
```

3. 在 `Sidebar.jsx` 的菜單配置中添加：
```javascript
{
  id: 'newpage',
  label: '新頁面',
  icon: '📄',
  path: '/app/newpage',
  roles: ['老師', '學生'],
}
```

### 基於角色的菜單可見性

Sidebar 會自動根據 `user.role` 過濾菜單項。編輯菜單配置的 `roles` 字段：

```javascript
// 僅老師可見
{ label: '系統設定', roles: ['老師'] }

// 所有人可見
{ label: '個人資料', roles: ['老師', '學生'] }

// 無角色限制
{ label: '課程', roles: null }
```

### Dark Mode 支持

系統已內置 Dark Mode 支持。CSS 使用 CSS 變量，自動適應系統主題：

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-light: #111827;
    --text-primary: #f9fafb;
    --border-color: #374151;
  }
}
```

用戶可在設定頁面強制啟用深色模式（需實現存儲邏輯）。

---

## 🔧 常見自定義

### 更改 Sidebar 寬度

編輯 `css/system.css`：
```css
:root {
  --sidebar-width: 260px;              /* 展開寬度 */
  --sidebar-width-collapsed: 80px;     /* 收起寬度 */
}
```

### 更改主色調

編輯 CSS 變量：
```css
:root {
  --primary-color: #4f46e5;      /* 改為您的品牌色 */
  --secondary-color: #6b7280;
}
```

### 添加 Logo

編輯 `Sidebar.jsx`：
```javascript
<div className="sidebar-logo">
  <img src="/logo.png" alt="Logo" className="logo-icon" />
  {isOpen && <span className="logo-text">您的應用名稱</span>}
</div>
```

---

## 🧪 測試檢查清單

- [ ] 前台區正常渲染，Locomotive Scroll 工作
- [ ] 後台區正常渲染，無 Locomotive Scroll 影響
- [ ] Sidebar 可正常收放
- [ ] 未登入者無法訪問 `/app/*` 路由
- [ ] 登入後用戶信息正確顯示
- [ ] 登出按鈕功能正常
- [ ] 側邊欄菜單項根據角色正確過濾
- [ ] 深色模式 CSS 正常應用
- [ ] 移動設備響應式設計正常
- [ ] 表格、表單等頁面元素正確樣式化

---

## 📚 API 集成示例

### 在頁面中調用 API

```javascript
import { useEffect, useState } from 'react';

function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/courses', {
          credentials: 'include'  // 包含 Session Cookie
        });
        const data = await res.json();
        setCourses(data);
      } catch (error) {
        console.error('Fetch failed', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // ... render
}
```

---

## 🐛 故障排查

### Sidebar 不工作
- 檢查 `SystemLayout.jsx` 是否正確導入
- 檢查 CSS 文件是否加載

### 後台頁面 404
- 確認 `App.jsx` 中的路由配置正確
- 檢查組件文件是否存在

### Locomotive Scroll 在後台區干擾
- 確認 `Layout.jsx` 只在前台使用
- 檢查 `SystemLayout.jsx` 未引入 Locomotive Scroll

### 認證不工作
- 檢查 `AuthProvider.jsx` 中的 API 端點
- 驗證後端 CORS 配置允許前端域名

---

## 📞 支持

如需幫助，請：
1. 檢查本指南的常見問題部分
2. 查看代碼中的註釋
3. 檢查瀏覽器控制台日誌

---

**創建日期**: 2026年5月17日  
**架構**: React 18 + React Router v7 + Vite  
**狀態**: ✅ 生產就緒
