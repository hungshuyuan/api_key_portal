import { useState, useEffect } from 'react';
import '../../../css/pages.css';

/**
 * API 金鑰管理頁面
 */
function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);

  useEffect(() => {
    // TODO: 調用後端 API 獲取金鑰列表
    setTimeout(() => {
      setApiKeys([
        { 
          id: 1, 
          name: '開發環境金鑰', 
          key: 'sk_test_xxxxxxxxxxxx',
          created: '2024-05-10',
          lastUsed: '2024-05-17',
          status: 'active'
        },
        { 
          id: 2, 
          name: '生產環境金鑰', 
          key: 'sk_prod_xxxxxxxxxxxx',
          created: '2024-01-15',
          lastUsed: '2024-05-16',
          status: 'active'
        },
        { 
          id: 3, 
          name: '舊測試金鑰', 
          key: 'sk_old_xxxxxxxxxxxx',
          created: '2023-12-01',
          lastUsed: '2024-04-30',
          status: 'inactive'
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleCreateKey = (e) => {
    e.preventDefault();
    // TODO: 提交表單到後端
    setShowNewKeyForm(false);
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    alert('已複製到剪貼板');
  };

  if (loading) return <div className="page-loader">加載中...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>API 金鑰管理</h1>
        <button className="btn btn-primary" onClick={() => setShowNewKeyForm(!showNewKeyForm)}>
          {showNewKeyForm ? '取消' : '生成新金鑰'}
        </button>
      </div>

      {showNewKeyForm && (
        <div className="form-section">
          <form onSubmit={handleCreateKey}>
            <div className="form-group">
              <label>金鑰名稱</label>
              <input type="text" placeholder="例: 生產環境金鑰" required />
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea placeholder="金鑰用途說明" rows="3"></textarea>
            </div>
            <button type="submit" className="btn btn-primary">生成</button>
          </form>
        </div>
      )}

      <div className="page-content">
        <table className="data-table">
          <thead>
            <tr>
              <th>名稱</th>
              <th>金鑰</th>
              <th>建立日期</th>
              <th>最後使用</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.map(key => (
              <tr key={key.id}>
                <td>{key.name}</td>
                <td className="key-cell">
                  <code>{key.key}</code>
                  <button 
                    className="btn btn-sm btn-copy"
                    onClick={() => handleCopyKey(key.key)}
                    title="複製"
                  >
                    📋
                  </button>
                </td>
                <td>{key.created}</td>
                <td>{key.lastUsed}</td>
                <td>
                  <span className={`status-badge status-${key.status}`}>
                    {key.status === 'active' ? '啟用' : '停用'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-edit">編輯</button>
                  <button className="btn btn-sm btn-delete">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ApiKeyManager;
