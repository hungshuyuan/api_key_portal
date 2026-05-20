import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// 🌟 1. 補上後端 API 基礎網址設定 (與 CourseList.jsx 保持一致)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://www.iai.nkust.edu.tw/iaibackend';// 注意：如果您有使用 Vite proxy，這行可以不用，但看起來您的專案是跨 Port 運作的。

const AuthContext = createContext({
  user: null,
  accessToken: null,
  loading: true,
  handleGoogleSuccess: () => {},
  logout: () => {}
});

// 解析 JWT 的輔助函式
const decodeJwt = (token) => { /*...保持不變...*/ 
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

const getUserRoleFromEmail = (email) => { /*...保持不變...*/ 
  if (!email) return '老師';
  const localPart = email.split('@')[0] || '';
  return /^[A-Za-z]\d{9}$/.test(localPart) ? '學生' : '老師';
};

const buildUserProfile = (data) => { /*...保持不變...*/ 
  if (!data) return null;
  const email = data.email || '';
  return {
    id: data.id || '', email, name: data.name || email || '使用者', picture: data.picture || '', role: getUserRoleFromEmail(email)
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => {
    try { return localStorage.getItem('access_token'); } catch (e) { return null; }
  });
  const [loading, setLoading] = useState(true);
  
  // 🌟 2. 修正：加上 API_BASE_URL
  const validateIdToken = async (idToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ Token: idToken, id_token: idToken })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Google token validation failed: ${text}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ 後端驗證失敗:', error);
      return null;
    }
  };

  // 🌟 3. 修正：加上 API_BASE_URL
  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.warn('Logout request failed', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('access_token');
    }
  };

  // 🌟 4. 修正：加上 API_BASE_URL
  const loadSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/session`, { credentials: 'include' });
      if (!response.ok) return null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;

    setLoading(true);
    const sessionData = await validateIdToken(credentialResponse.credential);
    
    // 🔍 顯影劑：看看後端到底回傳了什麼
    console.log("📥 後端核發登入結果:", sessionData);

    const tokenFromServer = sessionData?.access_token || sessionData?.token;
    
    // 🌟 5. 阻斷假性登入：如果後端沒有給 Token，就不允許登入！
    if (tokenFromServer) {
      setAccessToken(tokenFromServer);
      localStorage.setItem('access_token', tokenFromServer);
      setUser(buildUserProfile(sessionData.user));
      console.log("✅ 成功存入 Token:", tokenFromServer.substring(0, 15) + "...");
    } else {
      console.error("🚨 嚴重錯誤：前端拿不到後端的 Token！登入失敗。");
      alert("伺服器連線異常或無法核發憑證，請稍後再試！");
      // 這裡不可以再用 else if (payload) 去 faking user 了！
    }
    
    setLoading(false);
  };

  // 網頁初次載入檢查
  useEffect(() => {
    const restoreSession = async () => {
      setLoading(true);
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        const payload = decodeJwt(storedToken);
        if (payload) {
          setAccessToken(storedToken);
          setUser(buildUserProfile(payload));
          setLoading(false);
          return;
        }
      }
      const session = await loadSession();
      const sessionToken = session?.access_token || session?.token;
      if (sessionToken) {
        setAccessToken(sessionToken);
        localStorage.setItem('access_token', sessionToken);
        if (session?.user) setUser(buildUserProfile(session.user));
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const value = useMemo(
    () => ({ user, accessToken, loading, handleGoogleSuccess, logout }),
    [user, accessToken, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);