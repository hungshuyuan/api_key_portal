import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';

/**
 * 受保護的路由組件 - 檢查使用者登入狀態
 * 未登入者會被重定向到首頁
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        加載中...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
