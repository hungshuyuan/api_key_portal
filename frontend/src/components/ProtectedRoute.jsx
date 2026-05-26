import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';

// ✅ 與 Check.jsx 相同的白名單與判斷邏輯
const ALLOWED_STUDENT_IDS = ['C113118212', 'F114118119'];

const hasAccess = (user) => {
    if (!user) return false;
    const role = user.role || '';
    const studentId = (user.student_id || user.nkust_account || '').toUpperCase();
    if (role === '老師') return true;
    if (ALLOWED_STUDENT_IDS.includes(studentId)) return true;
    return false;
};

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

  // ✅ 已登入但無權限
  if (!hasAccess(user)) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', backgroundColor: '#f8f9fa',
        gap: '12px', textAlign: 'center', padding: '24px'
      }}>
        <div style={{ fontSize: '48px' }}>🚫</div>
        <h3 style={{ color: '#212529', margin: 0 }}>權限不足</h3>
        <p style={{ color: '#6c757d', margin: 0, fontSize: '14px' }}>
          目前後台系統僅開放給教職員使用。<br />
          如有疑問請洽電子計算機中心。
        </p>
        <a href="/" style={{ color: '#0d6efd', fontSize: '14px', marginTop: '8px' }}>
          ← 返回首頁
        </a>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;