document.addEventListener('DOMContentLoaded', () => {
    // 初始化 Locomotive Scroll
    const scroll = new LocomotiveScroll({
        el: document.querySelector('[data-scroll-container]'),
        smooth: true,
        lerp: 0.03,
        multiplier: 1.0,
        touchMultiplier: 2,
        smartphone: {
            smooth: true
        }
    });

    // navbar 滾動狀態
    const navbarContainer = document.getElementById("navContainer");
    const navbarScrollThreshold = 100;

    scroll.on('scroll', (args) => {
        if (navbarContainer) {
            navbarContainer.classList.toggle('is-scrolled', args.scroll.y >= navbarScrollThreshold);
        }
    });

    // Prism.js 高亮初始化
    if (window.Prism && Prism.highlightAll) {
        Prism.highlightAll();
    }
    
    // 讓 scroll to top 連結運作
    const backToTop = document.querySelector('a[href="#top"]');
    if (backToTop) {
        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            scroll.scrollTo('top', {
                duration: 1000,
                easing: [0.25, 0.00, 0.35, 1.00]
            });
        });
    }
});