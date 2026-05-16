import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext({
  user: null,
  loading: true,
  handleGoogleSuccess: () => {}, 
  logout: () => {}
});

// 解析 JWT 的輔助函式
const decodeJwt = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT', error);
    return null;
  }
};

const getUserRoleFromEmail = (email) => {
  if (!email) return '老師';
  const localPart = email.split('@')[0] || '';
  return /^[A-Za-z]\d{9}$/.test(localPart) ? '學生' : '老師';
};

const buildUserProfile = (data) => {
  if (!data) return null;
  const email = data.email || '';
  return {
    id: data.id || '',
    email,
    name: data.name || email || '使用者',
    picture: data.picture || '',
    role: getUserRoleFromEmail(email)
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 將 Google 的 id_token 送給後端驗證並建立 Session
  const validateIdToken = async (idToken) => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id_token: idToken })
      });
      if (!response.ok) throw new Error('Google token validation failed');
      return await response.json();
    } catch (error) {
      console.error('Google validation error', error);
      return null;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.warn('Logout request failed', error);
    } finally {
      setUser(null);
    }
  };

  // 取得後端目前的 Session 狀態
  const loadSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      });

      if (!response.ok) return null;

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        console.error('🚨 API 路由錯誤：伺服器回傳的不是 JSON 資料。這通常是 Nginx 轉發設定的問題。');
        return null;
      }

    } catch (error) {
      console.warn('Session fetch failed', error);
      return null;
    }
  };

  // 接收來自 <GoogleLogin /> 的成功回呼
  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      console.error('Google credential missing: 套件沒有回傳 id_token');
      return;
    }

    setLoading(true);
    const payload = decodeJwt(credentialResponse.credential);
    const sessionData = await validateIdToken(credentialResponse.credential);

    if (sessionData?.user) {
      setUser(buildUserProfile(sessionData.user));
    } else if (payload) {
      setUser(
        buildUserProfile({
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture
        })
      );
    }
    setLoading(false);
  };

  // 網頁初次載入時，檢查是否有既有的 Session
  useEffect(() => {
    const restoreSession = async () => {
      setLoading(true);
      const session = await loadSession();
      if (session?.user) {
        setUser(buildUserProfile(session.user));
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const value = useMemo(
    () => ({ user, loading, handleGoogleSuccess, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);