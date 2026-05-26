import { useEffect, useRef, useState } from 'react'; 
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import LocomotiveScroll from 'locomotive-scroll';
import 'locomotive-scroll/dist/locomotive-scroll.css';
import { getScrollInstance, setScrollInstance } from './scrollManager';
import { useAuth } from './AuthProvider';
import { GoogleLogin } from '@react-oauth/google'; 
import '../css/style.css';

const NAVBAR_SCROLL_THRESHOLD = 150;
const EASING = [0.25, 0.0, 0.35, 1.0];

const Layout = () => {
  const scrollContainerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, handleGoogleSuccess, loading } = useAuth(); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 👈 處理彈窗開啟時的背景滾動鎖定 (Locomotive Scroll)
  useEffect(() => {
    const scroll = getScrollInstance();
    if (isModalOpen) {
      if (scroll && typeof scroll.stop === 'function') scroll.stop();
    } else {
      if (scroll && typeof scroll.start === 'function') scroll.start();
    }
  }, [isModalOpen]);

  const handleNavClick = (e, path) => {
    setIsMobileMenuOpen(false);
    const scroll = getScrollInstance();
    if (scroll && typeof scroll.start === 'function') scroll.start();

    if (path.startsWith('#')) {
      e.preventDefault();
      const target = path === '#' ? 'top' : path;
      scroll?.scrollTo(target, { duration: 1000, offset: path === '#' ? 0 : -50, easing: EASING });
    }
  };

  const toggleMobileMenu = () => {
    const nextState = !isMobileMenuOpen;
    setIsMobileMenuOpen(nextState);
    const scroll = getScrollInstance();
    if (nextState) {
      if (scroll && typeof scroll.stop === 'function') scroll.stop();
    } else {
      if (scroll && typeof scroll.start === 'function') scroll.start();
    }
  };

  // Locomotive Scroll 初始化與狀態監聽
  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    const scroll = new LocomotiveScroll({
      el: scrollEl,
      smooth: true,
      lerp: 0.03,
      multiplier: 1.0,
      touchMultiplier: 2,
      firefoxMultiplier: 50,
      smoothMobile: true,
      smartphone: { smooth: true }
    });

    setScrollInstance(scroll);
    const navContainer = document.getElementById('navContainer');
    const scrollDownBtn = document.getElementById('scroll-down-btn');

    const updateNavbarState = (scrollY = 0) => {
      const navbar = document.querySelector('.navbar');
      if (!navContainer || !navbar) return;
      navContainer.classList.toggle('is-scrolled', scrollY >= NAVBAR_SCROLL_THRESHOLD);
    };

    const setMousePosition = (e) => {
      document.documentElement.style.setProperty('--m-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--m-y', `${e.clientY}px`);
    };

    const revealFadeIn = (entries, observerInstance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observerInstance.unobserve(entry.target);
        }
      });
    };

    const fadeInObserver = new IntersectionObserver(revealFadeIn, { threshold: 0.18 });
    const initFadeIns = () => {
      document.querySelectorAll('.fade-in').forEach((el) => fadeInObserver.observe(el));
    };

    const updateScroll = () => {
      if (scroll && typeof scroll.update === 'function') scroll.update();
    };

    const resizeObserver = new ResizeObserver(() => updateScroll());
    resizeObserver.observe(scrollEl);
    
    const handleWindowLoad = () => updateScroll();
    const handleWindowResize = () => updateScroll();

    window.addEventListener('mousemove', setMousePosition);
    scrollDownBtn?.addEventListener('click', () => scroll.scrollTo('#getting-started', { duration: 1000, easing: EASING }));
    window.addEventListener('load', handleWindowLoad);
    window.addEventListener('resize', handleWindowResize);

    initFadeIns();
    updateScroll();
    setTimeout(updateScroll, 600);
    updateNavbarState(scroll.scroll?.y ?? window.scrollY ?? 0);

    if (typeof scroll.on === 'function') {
      scroll.on('scroll', ({ scroll: scrollState }) => {
        updateNavbarState(scrollState?.y ?? 0);
      });
    } else {
      const handleScroll = () => updateNavbarState(window.scrollY || 0);
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', setMousePosition);
      window.removeEventListener('load', handleWindowLoad);
      window.removeEventListener('resize', handleWindowResize);
      scroll.destroy();
      setScrollInstance(null);
      fadeInObserver.disconnect();
    };
  }, [location.pathname]);

  return (
    <>
      <div id="mouse-glow"></div>
      <div className="bg-wrapper">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="navbar-container fade-in" id="navContainer">
        <div className="navbar">
          <div className="nav-brand">
            <Link to="/" onClick={(e) => handleNavClick(e, '/')} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="logo">高科 iAI</div>
            </Link>
            <span className="nav-status">online</span>
          </div>

          <div className="nav-links">
            <Link to="/" onClick={(e) => handleNavClick(e, '/')}>主頁</Link>
            <a href="#getting-started" onClick={(e) => handleNavClick(e, '#getting-started')}>快速開始</a>
            <a href="#resources" onClick={(e) => handleNavClick(e, '#resources')}>資源入口</a>
          </div>

          <div className="nav-actions">
            {user && (
              <div className="nav-user-info">
                <span className="nav-user-name"style={{ color: 'white' }}>{user.name}</span>
              </div>
            )}
            
            {user ? (
              <button className="nav-cta" type="button" onClick={() => navigate('/check')}>
                前往系統
              </button>
            ) : (
              // 👈 標頭的登入按鈕，點擊後觸發 setIsModalOpen(true)
              <button 
                className="nav-cta" 
                type="button" 
                onClick={() => setIsModalOpen(true)} 
                disabled={loading}
              >
                {loading ? '載入中...' : '登入'}
              </button>
            )}
            <button 
              className={`nav-menu-toggle ${isMobileMenuOpen ? 'is-open' : ''}`} 
              onClick={toggleMobileMenu}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>

{/* 手機版下拉選單 (附帶防穿透遮罩) */}
{isMobileMenuOpen && (
  <>
    {/* 🛡️ 1. 隱形防護罩：阻擋所有點擊穿透到底下文字，並點擊空白處關閉選單 */}
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99998,           /* 層級要比底下文字高，但比選單低 */
        pointerEvents: 'auto',   /* 強制接收點擊 */
        backgroundColor: 'rgba(0,0,0,0.01)' /* 極度透明的背景，確保能捕捉點擊 */
      }}
      onClick={() => setIsMobileMenuOpen(false)}
    />

    {/* 🚀 2. 選單本體 */}
    <div 
      className="mobile-nav-dropdown"
      style={{
        position: 'fixed',    
        top: '80px',          
        left: '50%',          
        transform: 'translateX(-50%)', 
        width: '90%',         
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '12px',
        padding: '10px',
        zIndex: 99999,        /* 最高層級，在防護罩之上 */
        pointerEvents: 'auto',/* 強制開啟點擊 */
        userSelect: 'none',   /* 避免文字被反白 */
        WebkitUserSelect: 'none'
      }}
    >
      {/* ⚠️ 這裡的每一個 Link，我都加上了 position: relative 和 zIndex，確保它們絕對能被點到 */}
      <Link to="/" onClick={(e) => handleNavClick(e, '/')} style={{ display: 'block', padding: '15px', color: 'white', borderBottom: '1px solid #30363d', position: 'relative', zIndex: 100000, textDecoration: 'none' }}>
        主視覺 <span style={{ color: '#fbbf24', float: 'right' }}>→</span>
      </Link>
      <a href="#getting-started" onClick={(e) => handleNavClick(e, '#getting-started')} style={{ display: 'block', padding: '15px', color: 'white', borderBottom: '1px solid #30363d', position: 'relative', zIndex: 100000, textDecoration: 'none' }}>
        快速開始 <span style={{ color: '#fbbf24', float: 'right' }}>→</span>
      </a>
      <a href="#resources" onClick={(e) => handleNavClick(e, '#resources')} style={{ display: 'block', padding: '15px', color: 'white', borderBottom: '1px solid #30363d', position: 'relative', zIndex: 100000, textDecoration: 'none' }}>
        資源入口 <span style={{ color: '#fbbf24', float: 'right' }}>→</span>
      </a>
      <Link to="/status" onClick={(e) => handleNavClick(e, '/status')} style={{ display: 'block', padding: '15px', color: 'white', borderBottom: '1px solid #30363d', position: 'relative', zIndex: 100000, textDecoration: 'none' }}>
        服務狀態 <span style={{ color: '#fbbf24', float: 'right' }}>→</span>
      </Link>
      <Link to="/announcements" onClick={(e) => handleNavClick(e, '/announcements')} style={{ display: 'block', padding: '15px', color: 'white', borderBottom: '1px solid #30363d', position: 'relative', zIndex: 100000, textDecoration: 'none' }}>
        公告中心 <span style={{ color: '#fbbf24', float: 'right' }}>→</span>
      </Link>
      {/* 根據登入狀態動態顯示按鈕 */}
      {user ? (
        <button 
          onClick={() => {
            setIsMobileMenuOpen(false); // 1. 收起手機版選單
            navigate('/app/apikey');    // 2. 已登入，跳轉至系統
          }} 
          style={{ 
            display: 'block', width: '100%', textAlign: 'left', 
            padding: '15px', color: 'white', position: 'relative', 
            zIndex: 100000, background: 'none', border: 'none', 
            fontSize: '1rem', cursor: 'pointer' 
          }}
        >
          前往系統 <span style={{ color: '#fbbf24', float: 'right' }}>→</span>
        </button>
      ) : (
        <button 
          onClick={() => {
            setIsMobileMenuOpen(false); // 1. 收起手機版選單
            setIsModalOpen(true);       // 2. 打開我們剛剛做好的 Google 登入彈窗
          }} 
          style={{ 
            display: 'block', width: '100%', textAlign: 'left', 
            padding: '15px', color: 'white', position: 'relative', 
            zIndex: 100000, background: 'none', border: 'none', 
            fontSize: '1rem', cursor: 'pointer' 
          }}
        >
          登入 <span style={{ color: '#fbbf24', float: 'right' }}>→</span>
        </button>
      )}
    </div>
  </>
)}
      </div>

      <div data-scroll-container id="main-scroll" ref={scrollContainerRef}>
        {/* 👈 透過 context 將打開彈窗的方法傳給底下的子頁面 (例如 Home.jsx) */}
        <Outlet context={{ openLoginModal: () => setIsModalOpen(true) }} />
      </div>

      {/* ======================================================== */}
      {/* 🚀 全站共用的高質感登入彈窗 (替換掉原本的原生 dialog) */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000,pointerEvents: 'auto'
        }}>
          <div style={{
            backgroundColor: '#18181b', border: '1px solid #27272a', padding: '40px 30px',
            borderRadius: '16px', position: 'relative', width: '90%', maxWidth: '380px',
            textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* 關閉視窗按鈕 */}
            <button 
              onClick={() => setIsModalOpen(false)} 
              style={{
                position: 'absolute', top: '15px', right: '15px', background: 'none',
                border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '18px'
              }}
            >
              ✕
            </button>
            
            {/* 標題與形象 */}
            <div style={{ marginBottom: '25px' }}>
              <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px 0' }}>歡迎使用高科 iAI</h2>
              <p style={{ color: '#71717a', fontSize: '14px', margin: 0 }}>請使用學校的 Google 帳號驗證身分</p>
            </div>
            
            {/* Google 登入組件 (已拔除 ux_mode) */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <GoogleLogin 
                onSuccess={(credentialResponse) => {
                  handleGoogleSuccess(credentialResponse);
                  setIsModalOpen(false); 
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

export default Layout;