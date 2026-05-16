import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// 1. 引入 Google OAuth 與你寫好的 AuthProvider
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './AuthProvider';
// 2. 透過 Vite 的環境變數安全讀取 Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

console.log("=== 檢查環境變數 ===");
console.log("原始字串:", GOOGLE_CLIENT_ID);
console.log("字串長度:", GOOGLE_CLIENT_ID?.length); 
console.log("有沒有包含空白?", GOOGLE_CLIENT_ID?.includes(" "));

if (!GOOGLE_CLIENT_ID) {
  console.warn("警告: 找不到 VITE_GOOGLE_CLIENT_ID，請確認 .env 檔案設定。");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 3. 將 App 包覆在 Provider 中 */}
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);