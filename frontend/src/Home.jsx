import { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from './AuthProvider';
import startImg from '../img/start.png';

const Home = () => {
  const { user, handleGoogleSuccess } = useAuth();
  const navigate = useNavigate();

  const context = useOutletContext();
  const openLoginModal = context?.openLoginModal || (() => console.warn('無法呼叫彈窗'));

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1 className="fade-in delay-1">邁向全校普惠的 <br /> AI 智慧校園</h1>
          <p className="fade-in delay-2">
            高科iAI——GPU資源服務轉型與AI智慧校園建置計畫，致力於打造全校普惠的AI智慧校園，提供學生、教師和研究人員便捷的GPU資源服務，推動AI技術在教育和研究中的廣泛應用。
          </p>
        </div>
        <div id="scroll-down-btn" className="scroll-down fade-in delay-3">Scroll</div>
      </section>

      <section className="getting-started" id="getting-started">
        <div className="stats-container fade-in">
          <div className="stat-card">
            <div className="stat-main">
              <h3>16+</h3>
              <p>H200 GPU</p>
            </div>
            <div className="stat-hover-content">
              <p>搭載頂級 Tensor Core 架構，提供無可挑剔的算力，支援超大規模深度學習與生成式模型訓練。</p>
              <span className="view-more">深入了解 →</span>
            </div>
          </div>
          <div className="stat-card delay-1">
            <div className="stat-main">
              <h3>1000+</h3>
              <p>註冊用戶</p>
            </div>
            <div className="stat-hover-content">
              <p>來自全校各系所的研究人員與學生，共同見證普惠 AI 帶來的革命性研究效率提升。</p>
            </div>
          </div>
          <div className="stat-card delay-2">
            <div className="stat-main">
              <h3>7+</h3>
              <p><Link to="/model" style={{ color: 'inherit', textDecoration: 'none' }}>可用模型</Link></p>
            </div>
            <div className="stat-hover-content">
              <p>無縫銜接最新的開源與企業級大型語言模型，並支援客製化微調以符合特定學術需求。</p>
              <span className="view-more">
                <Link to="/model" style={{ color: 'inherit', textDecoration: 'none' }}>瀏覽模型 →</Link>
              </span>
            </div>
          </div>
        </div>

        <div className="gs-container">
          <div className="gs-text fade-in">
            <h2>快速開始使用</h2>
            <p>只需幾個簡單的步驟，即使用強大的 AI 模型協助您完成任務。我們提供相容OpenAI 的 API 使您無需繁瑣學習即可上手。</p>
            <ul className="gs-steps">
              <li>第一步：申請並獲取專屬 API Key。</li>
              <li>第二步：使用openai格式向API發起請求。</li>
              <li>第三步：獲得結果。</li>
            </ul>

            <div className="gs-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {user ? (
                <button
                  onClick={() => navigate('/app/course')}
                  className="gs-btn primary"
                  style={{ cursor: 'pointer', border: 'none' }}
                >
                  進入 API 申請系統
                </button>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="gs-btn primary"
                  style={{ cursor: 'pointer', border: 'none' }}
                >
                  登入以開始使用
                </button>
              )}
              <Link to="/tutorial" className="gs-btn secondary">觀看完整圖文設定教學 &rarr;</Link>
            </div>
          </div>
          <div className="gs-image fade-in delay-2">
            <div className="screenshot-placeholder">
              <img src={startImg} alt="start" />
            </div>
          </div>
        </div>
      </section>

      <section className="resources-section" id="resources">
        <div className="resources-shell fade-in">
          <div className="resources-header">
            <p className="section-kicker">最後一頁</p>
            <h2>從這裡進入各種使用情境</h2>
            <p>
              把常用入口整理在同一頁，讓你可以快速跳到
              VSCode、OpenWebUI、服務狀態與公告資訊，不用再四處找連結。
            </p>
          </div>

          <div className="resource-grid">
            <Link to="/copliot" className="resource-card accent-blue" style={{ textDecoration: 'none' }}>
              <span className="resource-tag" style={{ color: 'white' }}>AI CODING</span>
              <h3>AI coding 應用範例教學</h3>
              <p>設定 API Key、安裝延伸模組、直接在編輯器中串接模型。</p>
              <span className="resource-link">進入教學 →</span>
            </Link>
            <a className="resource-card accent-amber" href="#">
              <span className="resource-tag" style={{ color: 'white' }}>OpenWebUI</span>
              <h3>自建ChatGPT應用教學，寫作協助、創意生圖一把罩</h3>
              <p>透過聊天式介面快速開始，寫作協助、生成圖像。</p>
              <span className="resource-link">前往教學 →</span>
            </a>
            <a className="resource-card accent-cyan" href="#">
              <span className="resource-tag" style={{ color: 'white' }}>Status</span>
              <h3>查看服務狀態</h3>
              <p>即時掌握資源運作情形、排程與維護公告，避免中斷時誤判。</p>
              <span className="resource-link">查看狀態 →</span>
            </a>
            <a className="resource-card accent-white" href="#">
              <span className="resource-tag" style={{ color: 'white' }}>News</span>
              <h3>閱讀公告與更新</h3>
              <p>掌握新模型上線、使用規範調整與最新操作說明。</p>
              <span className="resource-link">前往公告中心 →</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <div className="footer-brand">高科 iAI</div>
            <p>Nkust API server | Next Gen AI</p>
          </div>
          <div className="footer-links">
            <a href="#getting-started">如何開始</a>
            <a href="#resources">資源連結</a>
            <a href="#resources">服務入口</a>
            <a href="#resources">公告中心</a>
          </div>
          <p className="footer-note">打造全校普惠 AI 體驗。</p>
        </div>
      </footer>

      {/* Google 登入 Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#18181b', border: '1px solid #27272a', padding: '40px 30px',
            borderRadius: '16px', position: 'relative', width: '90%', maxWidth: '380px',
            textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute', top: '15px', right: '15px', background: 'none',
                border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '18px'
              }}
            >
              ✕
            </button>

            <div style={{ marginBottom: '25px' }}>
              <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px 0' }}>歡迎使用高科 iAI</h2>
              <p style={{ color: '#71717a', fontSize: '14px', margin: 0 }}>請使用學校的 Google 帳號驗證身分</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                console.log('1. onSuccess 觸發');
                await handleGoogleSuccess(credentialResponse);
                console.log('2. handleGoogleSuccess 完成');
                setIsModalOpen(false);
                console.log('3. Modal 關閉');
                navigate('/check');
                console.log('4. navigate 執行完');
              }}
                onError={() => console.error('Google 登入失敗')}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;