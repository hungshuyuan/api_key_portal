import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthProvider';
import { useNavigate } from 'react-router-dom';
import '../../css/topbar.css';

/**
 * 後台系統頂部導航欄
 */
function SystemTopbar({ onMenuClick, sidebarOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="system-topbar">
      <div className="topbar-left">
        {/* 漢堡菜單按鈕 */}
        <button 
          className="menu-toggle"
          onClick={onMenuClick}
          aria-label="切換側邊欄"
          title={sidebarOpen ? '收起側邊欄' : '展開側邊欄'}
        >
          <span className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      <div className="topbar-center">
        <h1 className="topbar-title">系統管理</h1>
      </div>

      <div className="topbar-right">
        {/* 用戶菜單 */}
        <div
          className={`user-dropdown ${isDropdownOpen ? 'open' : ''}`}
          ref={dropdownRef}
        >
          <button
            type="button"
            className="user-avatar-trigger"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-label="開啟使用者選單"
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
            title={user?.email}
          >
            <img
              src={user?.picture || '/default-avatar.png'}
              alt={user?.name}
              className="user-avatar-topbar"
            />
          </button>
          <div className="dropdown-menu">
            <div className="dropdown-header">
              <p className="dropdown-name">{user?.name}</p>
              <p className="dropdown-email">{user?.email}</p>
            </div>
            <hr className="dropdown-divider" />
            {/* <button className="dropdown-item" onClick={() => navigate('/app/profile')}>
              個人資料
            </button>
            <button className="dropdown-item" onClick={() => navigate('/app/settings')}>
              設定
            </button>
            <hr className="dropdown-divider" /> */}
            <button className="dropdown-item logout-item" onClick={handleLogout}>
              登出
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default SystemTopbar;
