import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './AuthProvider';

// Portal 前台組件
import Layout from './Layout';
import Home from './Home';
import Copliot from './Copliot';
import Model from './Model';
import Tutorial from './Tutorial';

// Dashboard 後台組件
import SystemLayout from './layouts/SystemLayout';
import ProtectedRoute from './components/ProtectedRoute';
import CourseList from './pages/dashboard/CourseList';
import ApiKeyManager from './pages/dashboard/ApiKeyManager';
import DashboardProfile from './pages/dashboard/Profile';
import DashboardSettings from './pages/dashboard/Settings';

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.error("找不到 Google Client ID，請檢查 .env 設定！");
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <Router basename="/portal">
          <Routes>
            {/* ========== 前台 Portal 區 ========== */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/copliot" element={<Copliot />} />
              <Route path="/model" element={<Model />} />
              <Route path="/tutorial" element={<Tutorial />} />
            </Route>

            {/* ========== 後台 Dashboard 區 ========== */}
            <Route
              element={
                <ProtectedRoute>
                  <SystemLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/app/course" element={<CourseList />} />
              <Route path="/app/apikey" element={<ApiKeyManager />} />
              <Route path="/app/profile" element={<DashboardProfile />} />
              <Route path="/app/settings" element={<DashboardSettings />} />
            </Route>

            {/* 404 路由 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

  
