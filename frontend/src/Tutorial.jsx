import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/plugins/autoloader/prism-autoloader';
import '../css/style.css';
import '../css/tutorial.css';

const Tutorial = () => {
  useEffect(() => {
    // Initialize Prism.js
    if (window.Prism && Prism.highlightAll) {
      Prism.highlightAll();
    }
  }, []);

  return (
    <>
      <div className="tutorial-bg"></div>

      <header className="tutorial-topbar">
        {/* 返回首頁維持使用 Link */}
        <Link className="tutorial-back" to="/">← 回首頁</Link>

        <div className="tutorial-brand">
          <span className="tutorial-brand__kicker">教學頁模板</span>
          <strong>API 使用教學 / 可擴充版型</strong>
        </div>

        <nav className="tutorial-chip-nav" aria-label="頁面導覽">
          {/* 將 href 替換為 onClick 事件 */}
          <a href="#overview">概覽</a>
          <a href="#prepare">準備</a>
          <a href="#code">程式</a>
          <a href="#layout">版型</a>
          <a href="#faq">FAQ</a>
        </nav>
      </header>

      <main className="tutorial-page-shell">
        <section className="tutorial-hero" id="top">
          <div className="tutorial-hero__content">
            <p className="tutorial-kicker">Template / 教學頁範本</p>
            <h1>把文字、照片與程式碼放在同一個可擴充頁面裡</h1>
            <p className="tutorial-lead">
              這是一個教學頁面的範本設計，整合了文字說明、圖片展示、程式碼範例等多種內容形式。無論是 API 文件、產品導覽還是技術教學，都能輕鬆適應。
            </p>

            <div className="tutorial-hero__actions">
              <a className="tutorial-button tutorial-button--primary" href="#overview">開始閱讀</a>
              <a className="tutorial-button tutorial-button--secondary" href="#code">看程式碼</a>
            </div>

            <div className="tutorial-badge-row">
              <span className="tutorial-badge">響應式設計</span>
              <span className="tutorial-badge">語法高亮</span>
              <span className="tutorial-badge">可擴充架構</span>
            </div>
          </div>

          <aside className="tutorial-hero__aside">
            <article className="tutorial-info-card">
              <h4>📖 教學內容</h4>
              <p>涵蓋從基礎設定到進階應用的完整指南</p>
            </article>

            <article className="tutorial-info-card">
              <h4>💻 程式範例</h4>
              <p>提供實際可執行的程式碼片段與說明</p>
            </article>

            <article className="tutorial-info-card">
              <h4>🎨 設計靈感</h4>
              <p>現代化的版面設計，適合各類技術文件</p>
            </article>
          </aside>
        </section>

        <section className="tutorial-section" id="overview">
          <div className="tutorial-split tutorial-split--reverse">
            <div className="tutorial-panel tutorial-panel--text">
              <p className="tutorial-section-label">01 範本特色</p>
              <h2>統一的視覺語言與靈活的內容架構</h2>
              <p>
                這個教學頁面範本採用了統一的設計系統，包括一致的色彩、字體、間距和動畫效果。
                同時提供了多種內容區塊的組合方式，讓你可以根據教學內容靈活調整版面。
              </p>
            </div>

            <figure className="tutorial-panel tutorial-panel--media">
              <div className="image-placeholder">
                <div>
                  <h3>範本示意圖</h3>
                  <p>這裡可以放教學頁面的整體示意圖或流程圖</p>
                </div>
              </div>
            </figure>
          </div>
        </section>

        <section className="tutorial-section tutorial-section--code" id="prepare">
          <div className="tutorial-dual-layout">
            <div className="tutorial-panel tutorial-panel--code">
              <div className="code-window">
                <div className="code-window__bar">
                  <div className="circle">
                    <span className="code_red"></span>
                    <span className="code_yellow"></span>
                    <span className="code_green"></span>
                  </div>
                  <strong>Terminal</strong>
                </div>
                <pre><code className="language-bash">{`curl -X POST https://api.example.com/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "請幫我整理這段筆記"}
    ]
  }'`}</code></pre>
              </div>
            </div>

            <div className="tutorial-panel tutorial-panel--notes">
              <p className="tutorial-section-label">02 API 請求範例</p>
              <h2>使用 cURL 發送請求</h2>
              <p>
                這是使用 cURL 命令行工具發送 API 請求的範例。程式碼區塊旁邊可以放補充說明，
                告訴讀者這段程式碼在做什麼、哪些欄位需要修改。
              </p>

              <div className="tutorial-checklist">
                <div>
                  <span>1</span>
                  <div>
                    <strong>替換 API Key</strong>
                    <p>把示範用的 API Key 改成自己的值。</p>
                  </div>
                </div>
                <div>
                  <span>2</span>
                  <div>
                    <strong>調整模型名稱</strong>
                    <p>根據實際可用模型替換 model 欄位。</p>
                  </div>
                </div>
                <div>
                  <span>3</span>
                  <div>
                    <strong>確認回應</strong>
                    <p>搭配回應範例一起展示，閱讀會更直覺。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="tutorial-section tutorial-section--cards" id="code">
          <div className="tutorial-section-heading">
            <p className="tutorial-section-label">03 內容區塊</p>
            <h2>同一頁可以混合不同元件，不需要每段都長得一樣</h2>
            <p>
              這裡示範三種不同的卡片風格：資訊卡、步驟卡和備註卡。它們共享同一套版面語言，
              但視覺比例、背景與內容重點各自不同。
            </p>
          </div>

          <div className="tutorial-card-grid">
            <article className="tutorial-feature-card tutorial-feature-card--soft">
              <span>文字導向</span>
              <h3>適合總覽與說明</h3>
              <p>這種卡片適合用來講原則、流程或注意事項，字量可以稍多一點。</p>
            </article>

            <article className="tutorial-feature-card tutorial-feature-card--visual">
              <span>照片導向</span>
              <h3>適合截圖與示意圖</h3>
              <p>把圖片當成主角，讓使用者先看到結果，再回頭閱讀文字說明。</p>
            </article>

            <article className="tutorial-feature-card tutorial-feature-card--code">
              <span>程式導向</span>
              <h3>適合 API 範例</h3>
              <p>把代碼與說明拆開，讓程式碼本身更清楚，同時保留導引文字。</p>
            </article>
          </div>
        </section>

        <section className="tutorial-section">
          <div className="tutorial-split">
            <div className="tutorial-panel tutorial-panel--text tutorial-panel--dark">
              <p className="tutorial-section-label">04 延伸用法</p>
              <h2>模板可以再往下長，像章節一樣逐步擴充</h2>
              <p>
                你可以複製這種左右分欄區塊，改成「左圖右文」、「左文右圖」、「圖文加程式碼」，
                或在下方再接一個 FAQ 區。這種寫法最適合將來持續新增教學內容。
              </p>
            </div>

            <div className="tutorial-panel tutorial-panel--mini-gallery">
              <div className="mini-tiles">
                <div>
                  <h4>左文右圖</h4>
                  <p>適合講解步驟</p>
                </div>
                <div>
                  <h4>左圖右文</h4>
                  <p>適合展示結果</p>
                </div>
                <div>
                  <h4>雙欄程式碼</h4>
                  <p>適合比較差異</p>
                </div>
                <div>
                  <h4>FAQ 區塊</h4>
                  <p>適合常見問題</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="tutorial-section tutorial-section--faq" id="faq">
          <div className="tutorial-section-heading">
            <p className="tutorial-section-label">05 FAQ</p>
            <h2>常見問題區也可以長得跟前面不同</h2>
          </div>

          <div className="tutorial-faq-grid">
            <article className="tutorial-faq-card">
              <h3>Q. 為什麼這個模板適合擴充？</h3>
              <p>因為每個 section 都有自己的定位，不會全部依賴同一種卡片樣式。</p>
            </article>

            <article className="tutorial-faq-card tutorial-faq-card--accent">
              <h3>Q. 如果要加更多圖片怎麼辦？</h3>
              <p>直接複製現有的 media 區塊，再換掉圖檔、caption 與順序即可。</p>
            </article>

            <article className="tutorial-faq-card">
              <h3>Q. 如果要加更多程式範例怎麼辦？</h3>
              <p>可以新增第二個 code window，或改成左右雙欄比較不同版本的 API 寫法。</p>
            </article>

            <article className="tutorial-faq-card tutorial-faq-card--soft">
              <h3>Q. 可以拿去做產品導覽頁嗎？</h3>
              <p>可以，這種模板同樣適合產品教學、使用手冊、 onboarding 或內部文件。</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="tutorial-footer">
        <div>
          <strong>教學頁模板</strong>
          <p>可直接複製成新的教學子頁，再依照內容替換圖片與程式碼。</p>
        </div>

        {/* 回到底部一樣套用 handleAnchorClick */}
        <a href="#top">回到頂部</a>
      </footer>
    </>
  );
};

export default Tutorial;