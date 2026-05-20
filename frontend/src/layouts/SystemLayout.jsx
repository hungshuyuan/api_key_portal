import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SystemTopbar from '../components/SystemTopbar';
import '../../css/system.css';

/**
 * 後台系統布局
 * 特性：
 * - 左側可收放 Sidebar（響應式設計）
 * - 右側 Outlet 顯示當前路由內容
 * - 原生瀏覽器滾動（不使用 Locomotive Scroll）
 * - Topbar 導航欄
 */
function SystemLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // 移動設備自動收起 Sidebar
      if (mobile) setSidebarOpen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="system-layout">
      {/* 頂部導航欄 */}
      <SystemTopbar onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />

      <div className="system-container">
        {/* 側邊欄 */}
        <Sidebar isOpen={sidebarOpen} isMobile={isMobile} onClose={() => setSidebarOpen(false)} />

        {/* 主內容區 */}
        <main className="system-content">
          <div className="content-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default SystemLayout;
