import { useState } from 'react';
import { useAuth } from '../../AuthProvider';
import '../../../css/pages.css';

/**
 * 個人資料頁面
 */
function DashboardProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: '人工智能學院',
    phone: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: 提交到後端
    console.log('更新用戶信息:', formData);
    setIsEditing(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>個人資料</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? '取消' : '編輯'}
        </button>
      </div>

      <div className="page-content">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <img src={user?.picture} alt={user?.name} className="profile-avatar" />
            {isEditing && <button className="btn-change-avatar">更換頭像</button>}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label>姓名</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>郵箱</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  disabled
                  title="郵箱無法修改"
                />
              </div>
              <div className="form-group">
                <label>所屬系所</label>
                <input 
                  type="text" 
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>電話</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="例: 0912345678"
                />
              </div>
              <button type="submit" className="btn btn-primary">保存</button>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-item">
                <span className="info-label">姓名</span>
                <span className="info-value">{formData.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">郵箱</span>
                <span className="info-value">{formData.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">所屬系所</span>
                <span className="info-value">{formData.department}</span>
              </div>
              <div className="info-item">
                <span className="info-label">角色</span>
                <span className="info-value">{user?.role}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardProfile;
