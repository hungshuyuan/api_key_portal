import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './AuthProvider';

// Portal 前台組件
import Layout from './Layout';
import Home from './Home';
import Copliot from './Copliot';
import Model from './Model';
import Tutorial from './Tutorial';

import Check from './Check';

// Dashboard 後台組件
import SystemLayout from './layouts/SystemLayout';
import ProtectedRoute from './components/ProtectedRoute';
import CourseList from './pages/dashboard/CourseList';
import ApiKeyManager from './pages/dashboard/ApiKeyManager';
import DashboardProfile from './pages/dashboard/Profile';
import DashboardSettings from './pages/dashboard/Settings';

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {/* 🟢 這些 Router 與 AuthProvider 一定要打開，否則 Context 會丟失 */}
      <Router basename="/portal">
        <AuthProvider>
          <Routes>
            {/* 1. 公開頁面 */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/copliot" element={<Copliot />} />
              <Route path="/model" element={<Model />} />
              <Route path="/tutorial" element={<Tutorial />} />
            </Route>
            <Route path="/check" element={<Check />} /> 
            {/* 2. 受保護頁面 (一定要寫在 AuthProvider 裡面) */}
            <Route
              element={
                <ProtectedRoute>
                  <SystemLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/app/course" element={<CourseList />} />
              <Route path="/app/apikey" element={<ApiKeyManager />} />
              {/* ... 其他路由 */}
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}
export default App;