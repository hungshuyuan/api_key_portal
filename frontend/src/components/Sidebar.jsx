import { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import '../../css/sidebar.css';

/**
 * 後台系統側邊欄
 * 特性：
 * - 動態菜單項配置
 * - 根據用戶角色動態顯示菜單
 * - 活躍狀態指示
 * - 移動設備自動關閉
 */
function Sidebar({ isOpen, isMobile, onClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState(null);

  // 菜單配置
  const menuConfig = useMemo(() => [
    {
      id: 'course',
      label: '課程管理',
      // icon: '📚',
      path: '/app/course',
      roles: ['老師', '學生'], // 誰可以看到
    },
    {
      id: 'apikey',
      label: 'API 金鑰',
      // icon: '🔑',
      path: '/app/apikey',
      roles: ['老師', '學生'],
    },
    {
      id: 'profile',
      label: '個人資料',
      // icon: '👤',
      path: '/app/profile',
      roles: ['老師', '學生'],
    },
    {
      id: 'settings',
      label: '系統設定',
      // icon: '⚙️',
      path: '/app/settings',
      roles: ['老師'], // 只有老師可見
    },
  ], []);

  // 根據用戶角色過濾菜單
  const visibleMenus = useMemo(() => {
    return menuConfig.filter(item => 
      !item.roles || (Array.isArray(item.roles) && item.roles.includes(user?.role))
    );
  }, [menuConfig, user?.role]);

  // 點擊菜單時，移動設備自動關閉側邊欄
  const handleMenuClick = () => {
    if (isMobile) onClose();
  };

  // 背景遮層（移動設備時點擊關閉）
  if (isMobile && isOpen) {
    return (
      <>
        <div className="sidebar-backdrop" onClick={onClose} />
        <SidebarContent 
          isOpen={isOpen} 
          menus={visibleMenus} 
          onMenuClick={handleMenuClick}
          user={user}
        />
      </>
    );
  }

  return (
    <SidebarContent 
      isOpen={isOpen} 
      menus={visibleMenus} 
      onMenuClick={handleMenuClick}
      user={user}
    />
  );
}

/**
 * 側邊欄內容組件
 */
function SidebarContent({ isOpen, menus, onMenuClick, user }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* Logo 區 */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">🎓</span>
          {isOpen && <span className="logo-text">IAI系統</span>}
        </div>
      </div>

      {/* 用戶信息 */}
      {isOpen && (
        <div className="sidebar-user">
          <img src={user?.picture || '/default-avatar.png'} alt={user?.name} className="user-avatar" />
          <div className="user-info">
            <p className="user-name">{user?.name}</p>
            <p className="user-role">{user?.role}</p>
          </div>
        </div>
      )}

      {/* 導航菜單 */}
      <nav className="sidebar-nav">
        {menus.map(menu => (
          <NavLink
            key={menu.id}
            to={menu.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onMenuClick}
            title={!isOpen ? menu.label : ''}
          >
            <span className="nav-icon">{menu.icon}</span>
            {isOpen && <span className="nav-label">{menu.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* 底部版本信息 */}
      {isOpen && (
        <div className="sidebar-footer">
          <p className="version-text">v1.0.0</p>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
