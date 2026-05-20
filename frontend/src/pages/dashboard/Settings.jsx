import { useState } from 'react';
import '../../../css/pages.css';

/**
 * 系統設定頁面（僅老師可訪問）
 */
function DashboardSettings() {
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    emailNotifications: true,
    twoFactorAuth: false,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    // TODO: 提交到後端
    console.log('保存設定:', settings);
    alert('設定已保存');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>系統設定</h1>
      </div>

      <div className="page-content">
        <div className="settings-section">
          <h2>顯示設定</h2>
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-text">深色模式</span>
              <span className="label-desc">使用深色主題</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.darkMode}
                onChange={() => handleToggle('darkMode')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>通知設定</h2>
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-text">系統通知</span>
              <span className="label-desc">接收系統內通知</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.notifications}
                onChange={() => handleToggle('notifications')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-text">電子郵件通知</span>
              <span className="label-desc">透過郵件接收通知</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>安全設定</h2>
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-text">雙因素認證</span>
              <span className="label-desc">額外安全保護</span>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.twoFactorAuth}
                onChange={() => handleToggle('twoFactorAuth')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn btn-primary" onClick={handleSave}>保存設定</button>
          <button className="btn btn-secondary">重置為預設</button>
        </div>
      </div>
    </div>
  );
}

export default DashboardSettings;
