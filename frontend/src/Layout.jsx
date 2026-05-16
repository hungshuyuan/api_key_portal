import { useEffect, useRef, useState } from 'react'; 
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LocomotiveScroll from 'locomotive-scroll';
import 'locomotive-scroll/dist/locomotive-scroll.css';
import { getScrollInstance, setScrollInstance } from './scrollManager';
import { useAuth } from './AuthProvider';
import { GoogleLogin } from '@react-oauth/google'; 
import '../css/style.css';

const NAVBAR_SCROLL_THRESHOLD = 150;
const EASING = [0.25, 0.0, 0.35, 1.0];

const Layout = ({ children }) => {
  const scrollContainerRef = useRef(null);
  const dialogRef = useRef(null); // 👈 新增：用於控制原生對話框的 Ref
  const location = useLocation();
  const navigate = useNavigate();
  const { user, handleGoogleSuccess, loading } = useAuth(); 
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 👈 新增：專門控制原生 Dialog 顯示與隱藏的系統
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isModalOpen) {
      dialog.showModal(); // 觸發最高層級顯示
      const scroll = getScrollInstance();
      if (scroll && typeof scroll.stop === 'function') scroll.stop();
    } else {
      dialog.close(); // 關閉
      const scroll = getScrollInstance();
      if (scroll && typeof scroll.start === 'function') scroll.start();
    }
  }, [isModalOpen]);

  // ⬇️ 以下 Locomotive Scroll 與導覽列邏輯維持原樣，但加上 update 與 fade-in fallback機制 ⬇️
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
    const navMenuToggle = document.getElementById('navMenuToggle');
    const navMenuPanel = document.getElementById('navMenuPanel');
    const navDrawerBackdrop = document.getElementById('navDrawerBackdrop');
    const scrollDownBtn = document.getElementById('scroll-down-btn');
    const fragmentLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
    const boundNavHandlers = [];

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

    const fadeInObserver = new IntersectionObserver(revealFadeIn, {
      threshold: 0.18
    });

    const initFadeIns = () => {
      document.querySelectorAll('.fade-in').forEach((el) => fadeInObserver.observe(el));
    };

    const updateScroll = () => {
      if (scroll && typeof scroll.update === 'function') {
        scroll.update();
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateScroll();
    });
    resizeObserver.observe(scrollEl);

    
    const handleWindowLoad = () => updateScroll();
    const handleWindowResize = () => updateScroll();

    const closeNavMenu = () => {
      if (!navContainer || !navMenuToggle || !navMenuPanel) return;
      navContainer.classList.remove('menu-open');
      navMenuToggle.classList.remove('is-open');
      if (typeof scroll.start === 'function') scroll.start();
    };

    const handleToggle = () => {
      if (!navContainer) return;
      if (navContainer.classList.contains('menu-open')) {
        closeNavMenu();
      } else {
        navContainer.classList.add('menu-open');
        navMenuToggle?.classList.add('is-open');
        if (typeof scroll.stop === 'function') scroll.stop();
      }
    };

    const handleDocumentClick = (e) => {
      if (!navContainer || !navContainer.classList.contains('menu-open')) return;
      if (!navContainer.contains(e.target)) closeNavMenu();
    };

    const bindNavLink = (link) => {
      const listener = (e) => {
        const targetId = link.getAttribute('href') || '';
        if (targetId.startsWith('#')) {
          e.preventDefault();
          closeNavMenu();
          const scrollInstance = getScrollInstance();
          const target = targetId === '#' ? 'top' : targetId;
          scrollInstance?.scrollTo(target, { duration: 1000, offset: targetId === '#' ? 0 : -50, easing: EASING });
        }
      };
      link.addEventListener('click', listener);
      boundNavHandlers.push({ link, listener });
    };

    fragmentLinks.forEach(bindNavLink);
    window.addEventListener('mousemove', setMousePosition);
    scrollDownBtn?.addEventListener('click', () => scroll.scrollTo('#getting-started', { duration: 1000, easing: EASING }));
    navMenuToggle?.addEventListener('click', handleToggle);
    document.addEventListener('click', handleDocumentClick);
    navDrawerBackdrop?.addEventListener('click', closeNavMenu);
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
      navMenuToggle?.removeEventListener('click', handleToggle);
      document.removeEventListener('click', handleDocumentClick);
      navDrawerBackdrop?.removeEventListener('click', closeNavMenu);
      boundNavHandlers.forEach(({ link, listener }) => link.removeEventListener('click', listener));
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
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="logo">高科 iAI</div>
            </Link>
            <span className="nav-status">online</span>
          </div>

          <div className="nav-links">
            <Link to="/">主頁</Link>
            <a href="#getting-started">快速開始</a>
            <a href="#resources">資源入口</a>
          </div>

          <div className="nav-actions">
            {user && (
              <div className="nav-user-info">
                <span className="nav-user-name">{user.name}</span>
              </div>
            )}
            
            {user ? (
              <button className="nav-cta" type="button" onClick={() => navigate('/copliot')}>
                前往系統
              </button>
            ) : (
              <button 
                className="nav-cta" 
                type="button" 
                onClick={() => setIsModalOpen(true)} 
                disabled={loading}
              >
                {loading ? '載入中...' : '登入'}
              </button>
            )}
            <button className="nav-menu-toggle" id="navMenuToggle">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </div>

      <div data-scroll-container id="main-scroll" ref={scrollContainerRef}>
        {children}
      </div>

      {/* ======================================================== */}
      {/* 🚀 終極防禦：原生對話框 (Top Layer API)                      */}
      {/* ======================================================== */}
      <dialog 
        ref={dialogRef} 
        className="native-iai-dialog"
        onCancel={() => setIsModalOpen(false)} // 支援按 ESC 關閉
      >
        <div className="dialog-content-wrapper">
          <button onClick={() => setIsModalOpen(false)} className="dialog-close-btn">✕</button>
          
          <h2>歡迎登入高科 iAI</h2>
          <p>請使用學校 Google 帳號驗證身分</p>
          
          <div className="google-btn-container">
            <GoogleLogin 
              onSuccess={(res) => {
                handleGoogleSuccess(res);
                setIsModalOpen(false); 
              }}
              onError={() => console.error('Login Failed')}
            />
          </div>
        </div>
      </dialog>
    </>
  );
};

export default Layout;