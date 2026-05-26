import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://www.iai.nkust.edu.tw/iaibackend';

const AuthContext = createContext({
  user: null,
  accessToken: null,
  loading: true,
  handleGoogleSuccess: () => {},
  logout: () => {},
  refreshUserStatus: () => {} // 🌟 新增：允許元件強制更新用戶狀態
});

// ... (decodeJwt 與 buildUserProfile 函式保持不變) ...
const decodeJwt = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) { return null; }
};

const buildUserProfile = (data) => {
  if (!data) return null;
  const email = data.email || '';
  return {
    id: data.id || data.student_id || '',
    email,
    name: data.ad_audit_info?.name || data.name || email || '使用者',    student_id: data.student_id || email.split('@')[0],
    picture: data.picture || '',
    nkust_account: data.nkust_account || data.account || email.split('@')[0],
    ad_audit_info: data.ad_audit_info || null,
    role: data.ad_audit_info?.role ? data.ad_audit_info.role : '未知',
    tos_agreed: data.tos_agreed ?? false
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => {
    try { return localStorage.getItem('access_token'); } catch (e) { return null; }
  });
  const [loading, setLoading] = useState(true);

  // 🌟 新增：從後端同步最新 User 資料 (用於 Check.jsx 同意條款後)
  const refreshUserStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.logged_in && data.user) {
          setUser(buildUserProfile(data.user));
        }
      }
    } catch (err) {
      console.error("重新整理使用者狀態失敗:", err);
    }
  };

  // ... (validateIdToken, logout, loadSession 保持不變) ...
  const validateIdToken = async (idToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ Token: idToken, id_token: idToken })
      });
      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    } catch (error) { return null; }
  };

  const logout = async () => {
    try { await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }); } 
    catch (error) { console.warn('Logout failed', error); } 
    finally { setUser(null); setAccessToken(null); localStorage.removeItem('access_token'); }
  };

  const loadSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/session`, { credentials: 'include' });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) { return null; }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;
    setLoading(true);
    const sessionData = await validateIdToken(credentialResponse.credential);
    const tokenFromServer = sessionData?.access_token || sessionData?.token;
    if (tokenFromServer) {
      setAccessToken(tokenFromServer);
      localStorage.setItem('access_token', tokenFromServer);
      setUser(buildUserProfile(sessionData.user));
    }
    setLoading(false);
  };

  useEffect(() => {
    const restoreSession = async () => {
      setLoading(true);
      const session = await loadSession();
      if (session?.user) {
        setUser(buildUserProfile(session.user));
      } else {
        // 若 Session 過期，嘗試移除 token
        localStorage.removeItem('access_token');
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const value = useMemo(
    () => ({ user, accessToken, loading, handleGoogleSuccess, logout, refreshUserStatus }),
    [user, accessToken, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);