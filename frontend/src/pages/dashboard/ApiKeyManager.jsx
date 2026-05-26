import { useState, useEffect } from 'react';
// 🌟 完美整合你的 AuthProvider
import { useAuth } from '../../AuthProvider'; 
import '../../../css/pages.css';

// 假設你的 API 基礎路徑設定，可根據專案範例修改
const LITELLM_API_URL = import.meta.env.VITE_API_BASE_URL;

function ApiKeyManager() {
  // 🟢 Hook 必須在元件函數的「第一層」內部呼叫
  const { user, accessToken } = useAuth(); 

  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);        // 獲取/申請的載入狀態

  // Modal 狀態
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [revealedKey, setRevealedKey] = useState(null);
  
  // 註銷 Modal 狀態
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ==========================================
  // 1. 獲取 API 金鑰列表 (Fetch List)
  // ==========================================
  const fetchApiKeys = async () => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${LITELLM_API_URL}/api/keys`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('無法取得 API Key 列表');
      
      const data = await response.json();
      // data 應為陣列，對應後端回傳的欄位
      setKeys(data);
    } catch (error) {
      console.error('Fetch keys error:', error);
      alert('載入金鑰失敗，請稍後再試');
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, [accessToken]);

  // ==========================================
  // 2. 申請新金鑰 (Create/Generate Key)
  // ==========================================
  const handleApplyKey = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${LITELLM_API_URL}/api/keys/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        // 如果後端需要自訂名稱，這裡可以傳，目前先由後端自動生成
        body: JSON.stringify({ student_id: user?.id }) 
      });

      if (!response.ok) throw new Error('申請失敗');
      
      const data = await response.json();
      
      // 假設後端 POST 成功後會回傳：
      // { 
      //   plainTextKey: "sk-new-xxxx...",  <- 只有這次看得到的完整明文
      //   newKey: { id: 12, key_alias: "sk-...XyZ1", ... } <- 塞進列表的物件
      // }
      setNewlyCreatedKey(data.plainTextKey);
      
      // 重新整理列表，讓新產生的 key 出現在最上面
      await fetchApiKeys(); 
    } catch (error) {
      console.error('Apply key error:', error);
      alert('金鑰申請失敗');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 3. 查看完整金鑰 (Reveal Key)
  // 備註：若後端走安全機制不給看，這個功能與按鈕可以直接拔掉
  // ==========================================
  const handleRevealKey = async (id) => {
    try {
      const response = await fetch(`${LITELLM_API_URL}/api/keys/${id}/reveal`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!response.ok) throw new Error('無權限查看或該 Key 不支援查看');
      
      const data = await response.json();
      setRevealedKey(data.raw_key); // 假設後端解密後回傳 { raw_key: "..." }
    } catch (error) {
      console.error('Reveal key error:', error);
      alert('無法查看完整金鑰（可能系統基於安全性未儲存明文）');
    }
  };

  // ==========================================
  // 4. 註銷金鑰 (Delete / Revoke Key)
  // ==========================================
  const handleDeleteKey = (id, keyAlias) => {
    setDeleteTarget({ id, keyName: keyAlias });
    setDeleteInput(''); 
  };

  const confirmDeleteKey = async () => {
  // 🌟 修正：直接抓取 user?.student_id 進行過濾與大寫轉換
  const cleanInput = String(deleteInput || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const cleanUserId = String(user?.student_id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // 驗證輸入學號是否與登入者相符
  if (cleanInput !== cleanUserId) {
    alert(`學號輸入錯誤！\n\n你輸入的: [${cleanInput}]\n系統應該是: [${cleanUserId}]`);
    return;
  }
  
  setDeleteLoading(true);
    try {
      const response = await fetch(`${LITELLM_API_URL}/api/keys/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok) throw new Error('註銷失敗');

      // 從狀態中過濾掉被刪除的 key
      setKeys(keys.filter(k => k.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeleteInput('');
      alert('金鑰已成功註銷');
    } catch (error) {
      console.error('Delete key error:', error);
      alert('註銷金鑰失敗');
    } finally {
      setDeleteLoading(false);
    }
  };

  // 如果沒有 token 或 user，代表被登出了，這時安全返回空畫面交給 ProtectedRoute 去跳轉
  if (!accessToken || !user) {
    return <div style={{ padding: '20px' }}>讀取權限中...</div>;
  }

  // 用於安全讀取目前總量與預算（因應 DB 欄位缺失，這裡做防呆防爆）
  const totalSpend = keys[0]?.user_total_spend ?? 0.0000;
  const maxBudget = keys[0]?.max_budget ?? 12.00;
  const budgetDuration = keys[0]?.budget_duration ?? '1天';

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', padding: '20px' }}>
      
      {/* ===== 申請成功 Modal ===== */}
      {newlyCreatedKey && (
        <div
          onClick={() => setNewlyCreatedKey(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '36px 32px 28px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '22px' }}>🎉</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#111' }}>申請成功</span>
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#e53935', fontWeight: 500 }}>
              請立即複製並妥善保存，此 Key 之後將無法再次完整顯示。
            </p>
            <div style={{ position: 'relative', backgroundColor: '#f7f7f8', border: '1px solid #e5e5e5', borderRadius: '10px', padding: '14px 48px 14px 16px', marginBottom: '24px' }}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#111', wordBreak: 'break-all', lineHeight: '1.6' }}>
                {newlyCreatedKey}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(newlyCreatedKey);
                  alert('已複製到剪貼簿！');
                }}
                style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
              >
                📋
              </button>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              style={{ width: '100%', padding: '11px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
            >
              已複製，關閉
            </button>
          </div>
        </div>
      )}

      {/* ===== 查看 Raw Key Modal ===== */}
      {revealedKey && (
        <div
          onClick={() => setRevealedKey(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '36px 32px 28px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '22px' }}>🔑</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#111' }}>API Key 明文</span>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#888' }}>請妥善保管，勿分享給他人。</p>
            <div style={{ position: 'relative', backgroundColor: '#f7f7f8', border: '1px solid #e5e5e5', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px', wordBreak: 'break-all', fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#111', lineHeight: '1.6' }}>
              {revealedKey}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(revealedKey);
                  alert('已複製到剪貼簿！');
                }}
                style={{ flex: 1, padding: '11px', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
              >
                📋 複製
              </button>
              <button
                onClick={() => setRevealedKey(null)}
                style={{ flex: 1, padding: '11px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 註銷確認 Modal ===== */}
      {deleteTarget && (
        <div
          onClick={() => setDeleteTarget(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '36px 32px 28px', maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '22px' }}>⚠️</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#111' }}>確認註銷</span>
            </div>
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#555' }}>
              即將註銷以下 API Key，此操作無法復原：
            </p>
            <div style={{ backgroundColor: '#f7f7f8', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#111' }}>
              {deleteTarget.keyName}
            </div>
            
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#555' }}>
              請輸入您的學號以確認：
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="請輸入學號"
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, padding: '11px', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
              >
                取消
              </button>
              <button
                onClick={confirmDeleteKey}
                style={{ flex: 1, padding: '11px',/*  backgroundColor: deleteInput === user?.id ? '#e53935' : '#f5c6c6', color: '#fff', border: 'none', borderRadius: '8px', cursor: deleteInput === user?.id ? 'pointer' : 'not-allowed', */ fontSize: '14px', fontWeight: 600, transition: 'background-color 0.2s' }}
              >
                {deleteLoading ? '註銷中...' : '確認註銷'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 主畫面渲染 --- */}
      <div style={{ marginTop: '10px', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#111' }}>歡迎回來，{user.name}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleApplyKey}
              disabled={loading}
              style={{
                padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                backgroundColor: '#111', color: '#fff', border: 'none',
                borderRadius: '8px', letterSpacing: '0.3px', opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? '申請中...' : '+ 申請新 Key'}
            </button>
          </div>
        </div>

        {/* 帳號用量概覽卡片 */}
        {keys.length > 0 && (
          <div style={{ backgroundColor: '#f7f7f8', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>帳號用量概覽</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#111' }}>
                ${Number(totalSpend).toFixed(4)}
              </span>
              <span style={{ fontSize: '14px', color: '#888' }}>/ ${maxBudget}</span>
            </div>
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#aaa' }}>
              每 {budgetDuration} 重置
            </div>
            <div style={{ marginTop: '10px', height: '6px', backgroundColor: '#e0e0e0', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '99px', backgroundColor: '#111',
                width: `${Math.min(totalSpend / maxBudget * 100, 100)}%`
              }} />
            </div>
          </div>
        )}

        {/* Key 列表 */}
        <div style={{ fontSize: '13px', color: '#888', marginBottom: '10px', fontWeight: 500 }}>
          API Keys（{keys.length}）
        </div>

        {keys.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed #ddd', borderRadius: '12px', color: '#aaa', fontSize: '14px' }}>
            尚未申請任何 API Key
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {keys.map((k) => (
              <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1px solid #e5e5e5', borderRadius: '10px', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '14px', color: '#111', marginBottom: '4px' }}>
                  {k.key_name || k.key_alias} 
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    此 Key 用量：<span style={{ color: '#555', fontWeight: 600 }}>${Number(k.spend ?? 0).toFixed(5)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '16px' }}>
                  <button
                    onClick={() => handleRevealKey(k.id)}
                    style={{ padding: '7px 14px', fontSize: '13px', cursor: 'pointer', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '6px', fontWeight: 500 }}
                  >
                    查看
                  </button>
                  <button
                    onClick={() => handleDeleteKey(k.id, k.key_name || k.key_alias)}
                    style={{ padding: '7px 14px', fontSize: '13px', cursor: 'pointer', backgroundColor: '#fff0f0', color: '#e53935', border: '1px solid #ffd0d0', borderRadius: '6px', fontWeight: 500 }}
                  >
                    註銷
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ApiKeyManager;