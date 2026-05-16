// ==========================================
// Locomotive Scroll 初始化與參數調整
// ==========================================
const scroll = new LocomotiveScroll({
    el: document.querySelector('[data-scroll-container]'),
    smooth: true,
    
    // --- 強弱調整參數 ---
    // lerp: 慣性大小，數值越小越平滑/越慢 (建議範圍 0.05 ~ 0.1)
    lerp: 0.03, 
    
    // multiplier: 滾動速度倍率，數值越大滾得越快
    multiplier: 1.0, 
    
    // touchMultiplier: 手機端滾動倍率
    touchMultiplier: 2,
    
    // firefoxMultiplier: Firefox 瀏覽器滾動倍率
    firefoxMultiplier: 50,
    
    // 讓內容在滾動時保持平滑感
    smoothMobile: true,
    smartphone: {
        smooth: true
    }
});

// ==========================================
// 導航欄 (Portal Control Dock)
// ==========================================
const navContainer = document.getElementById("navContainer");
const navMenuToggle = document.getElementById("navMenuToggle");
const navMenuPanel = document.getElementById("navMenuPanel");
const navDrawerBackdrop = document.getElementById("navDrawerBackdrop");
const navbar = document.querySelector('.navbar');
const navbarScrollThreshold = 150;

const updateNavbarState = (scrollY = 0) => {
    if (!navContainer || !navbar) {
        return;
    }

    navContainer.classList.toggle('is-scrolled', scrollY >= navbarScrollThreshold);
};

// ==========================================
// 滑鼠跟隨 (保持不變)
// ==========================================
window.addEventListener("mousemove", (e) => {
    document.documentElement.style.setProperty('--m-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--m-y', `${e.clientY}px`);
});

// ==========================================
// 修正：如果頁面有動態高度變化（例如圖片加載），重新計算
// ==========================================
window.addEventListener('load', () => {
    scroll.update();
    updateNavbarState(scroll.scroll?.y ?? window.scrollY ?? 0);
});

if (typeof scroll.on === 'function') {
    scroll.on('scroll', (args) => {
        updateNavbarState(args?.scroll?.y ?? 0);
    });
} else {
    window.addEventListener('scroll', () => {
        updateNavbarState(window.scrollY || 0);
    }, { passive: true });
}

const scrollDownBtn = document.getElementById('scroll-down-btn');

if (scrollDownBtn) {
    scrollDownBtn.addEventListener('click', () => {
        // 使用 Locomotive 的 scrollTo 方法
        // 'next' 可以自動找下一個 section，或者直接傳入位移數值/目標元素
        // 這裡我們傳入 window.innerHeight 模擬你原本的滾動一屏效果
        scroll.scrollTo("#getting-started", {
            duration: 1000,      // 滾動時間 (毫秒)
            easing: [0.25, 0.0, 0.35, 1.0] // 自定義貝茲曲線，讓過渡更高級
        });
    });
}

const navLinks = document.querySelectorAll('.nav-links a');
const navMenuLinks = document.querySelectorAll('.nav-menu-panel a');

const closeNavMenu = () => {
    if (!navContainer || !navMenuToggle || !navMenuPanel) {
        return;
    }

    navContainer.classList.remove('menu-open');
    navMenuToggle.classList.remove('is-open');
    navMenuToggle.setAttribute('aria-expanded', 'false');
    navMenuPanel.setAttribute('aria-hidden', 'true');
    if (navDrawerBackdrop) {
        navDrawerBackdrop.setAttribute('aria-hidden', 'true');
    }
    if (typeof scroll.start === 'function') {
        scroll.start();
    }
};

const openNavMenu = () => {
    if (!navContainer || !navMenuToggle || !navMenuPanel) {
        return;
    }

    navContainer.classList.add('menu-open');
    navMenuToggle.classList.add('is-open');
    navMenuToggle.setAttribute('aria-expanded', 'true');
    navMenuPanel.setAttribute('aria-hidden', 'false');
    if (navDrawerBackdrop) {
        navDrawerBackdrop.setAttribute('aria-hidden', 'false');
    }
    if (typeof scroll.stop === 'function') {
        scroll.stop();
    }
};

if (navMenuToggle) {
    navMenuToggle.addEventListener('click', () => {
        if (navContainer.classList.contains('menu-open')) {
            closeNavMenu();
        } else {
            openNavMenu();
        }
    });
}

document.addEventListener('click', (e) => {
    if (!navContainer || !navContainer.classList.contains('menu-open')) {
        return;
    }

    const clickedInsideNav = navContainer.contains(e.target);
    if (!clickedInsideNav) {
        closeNavMenu();
    }
});

if (navDrawerBackdrop) {
    navDrawerBackdrop.addEventListener('click', () => {
        closeNavMenu();
    });
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeNavMenu();
    }
});

const bindNavLink = (link) => {
    link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');

        if (targetId.startsWith('#')) {
            e.preventDefault();

            closeNavMenu();

            if (targetId === '#') {
                scroll.scrollTo('top', {
                    duration: 1000,
                    easing: [0.25, 0.0, 0.35, 1.0]
                });
            } else {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    scroll.scrollTo(targetElement, {
                        duration: 1000,
                        offset: -50,
                        easing: [0.25, 0.0, 0.35, 1.0]
                    });
                }
            }
        } else {
            closeNavMenu();
        }
    });
};

navLinks.forEach(bindNavLink);
navMenuLinks.forEach(bindNavLink);

// ==========================================
// Reveal-once: 使用 IntersectionObserver 在元素
// 第一次進入視窗時加入 .in-view（觸發 fade-in）
// 同時保留已有的動畫（例如 scroll-down 的 bounce）
// ==========================================
(() => {
    const elems = document.querySelectorAll('.fade-in');
    if (!('IntersectionObserver' in window) || elems.length === 0) return;

    const io = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.18 });

    elems.forEach(el => io.observe(el));
})();