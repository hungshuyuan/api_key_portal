import { useEffect } from 'react';
// 移除 Locomotive Scroll 的引入，因為 Layout 已經幫你做好了
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/plugins/autoloader/prism-autoloader';
import '../css/tutorial.css';
import '../css/copliot.css';

const Copliot = () => {

  useEffect(() => {
    // 這裡只需要留著 PrismJS (程式碼高亮) 的初始化就好
    // 因為這項功能是 Copliot 頁面專屬的
    if (window.Prism && Prism.highlightAll) {
      Prism.highlightAll();
    }
    
    // 強制將瀏覽器原生捲動軸歸零
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {/* 背景動畫 */}
      <div className="tutorial-bg bg-wrapper">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* 注意：
        1. 刪除了 <header> 導覽列，統一由 Layout 顯示
        2. 刪除了 ref={scrollContainerRef} 與 data-scroll-container，由 Layout 控制捲動
      */}
      <div className="tutorial-page-shell" style={{ paddingTop: '150px' }}>
        
        <section data-scroll data-scroll-speed="1" className="tutorial-hero" id="top">
          <div className="tutorial-hero__content">
            <p className="tutorial-kicker">Environment Setup / 環境建置</p>
            <h1>如何在 VSCode 使用高科iAI服務撰寫程式</h1>
            <p className="tutorial-lead">
              本教學將引導您安裝 VSCode 工具，並綁定專屬的 iAI API Key，讓您在本地編輯器無縫使用 `gpt-oss-120b` 等強大語言模型，提供程式碼撰寫與對話支援。
            </p>

            <div className="tutorial-hero__actions">
              <a className="tutorial-button tutorial-button--primary" href="#step-1">開始安裝</a>
            </div>
          </div>

          <aside className="tutorial-hero__aside" style={{ display: 'flex' }}>
            <div className="image-placeholder" style={{ flex: 1, padding: 0, overflow: 'hidden', borderRadius: '24px', position: 'relative', background: '#000', minHeight: '400px', aspectRatio: '16/9' }}>
              <video controls style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '24px' }}>
                <source src="#" type="video/mp4" />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#fff', textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '8px' }}>影片介紹播放區</h3>
                  <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>請替換 video src 來源</p>
                </div>
              </video>
            </div>
          </aside>
        </section>

        <div className="timeline-container">
          <section data-scroll className="tutorial-section timeline-step" id="step-1">
            <div className="tutorial-split">
              <div className="tutorial-panel tutorial-panel--text">
                <p className="tutorial-section-label">Step 01 基礎安裝程序</p>
                <h2>先準備好開發環境與必要外掛</h2>
                <p>想要在編輯器內自動補全程式碼或者進行 AI 對話，您需要先安裝 VSCode 及相關的 GitHub Copilot 套件。</p>

                <ul className="tutorial-list">
                  <li><strong>步驟 1</strong>：至官網下載並安裝 VSCode。</li>
                  <li><strong>步驟 2</strong>：在擴充功能中搜尋並安裝 <code>GitHub Copilot</code> 外掛。</li>
                  <li><strong>步驟 3</strong>：再搜尋並安裝 <code>LiteLLM Provider for GitHub Copilot Chat</code> 外掛。</li>
                </ul>
              </div>

              <figure className="tutorial-panel tutorial-panel--media" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="image-placeholder" style={{ border: 'none', borderRadius: '28px' }}>
                  <div>
                    <h3 style={{ color: '#fff', marginBottom: '8px' }}>圖片佔位區</h3>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>放置 VSCode 下載或套件安裝截圖</p>
                  </div>
                </div>
              </figure>
            </div>
          </section>

          <section data-scroll className="tutorial-section timeline-step" id="step-2">
            <div className="tutorial-split tutorial-split--reverse">
              <div className="tutorial-panel tutorial-panel--text">
                <p className="tutorial-section-label">Step 02 設定 API 伺服器</p>
                <h2>連線至 LiteLLM Provider</h2>
                <p style={{ marginBottom: '20px', color: '#cbd5e1' }}>呼叫功能表並輸入對應的位址：</p>

                <ul className="tutorial-list">
                  <li><strong>呼叫命令控制板</strong>：Windows 使用 <code>Ctrl+Shift+P</code>，Mac 使用 <code>Cmd+Shift+P</code>。</li>
                  <li><strong>輸入與選擇</strong>：搜尋並點擊 <code>Manage LiteLLM Provider</code>。</li>
                  <li><strong>輸入伺服器 URL 以及 API Key</strong>：依照提示貼上 <code>https://www.iai.nkust.edu.tw/aihub</code> 以及您的個人專屬密鑰。</li>
                </ul>
              </div>

              <div className="tutorial-panel tutorial-panel--code" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="code-window">
                  <div className="code-window__bar">
                    <div className="circle">
                      <span className="code_red"></span>
                      <span className="code_yellow"></span>
                      <span className="code_green"></span>
                    </div>
                    <strong>Command Palette</strong>
                  </div>
                  <pre><code className="language-bash">{`# 按下 Ctrl+Shift+P，輸入並選擇：
Manage LiteLLM Provider

# 接著輸入 URL 和您的 API Key：
https://www.iai.nkust.edu.tw/aihub`}</code></pre>
                </div>
              </div>
            </div>
          </section>

          <section data-scroll className="tutorial-section timeline-step" id="step-3">
            <div className="tutorial-split">
              <div className="tutorial-panel tutorial-panel--text">
                <p className="tutorial-section-label">Step 03 啟用語言模型</p>
                <h2>管理與選擇模型</h2>
                <p>完成連線後，需在列表選擇並啟用您想要使用的模型才能順利對話。</p>

                <ul className="tutorial-list">
                  <li><strong>Manage Models</strong>：按下 <code>Ctrl+Shift+P</code>，輸入「Manage Language Models」。</li>
                  <li><strong>尋找群組</strong>：在下方 LiteLLM 群組找到如「gpt-oss-120b」的模型。</li>
                  <li><strong>開啟模型</strong>：將滑鼠移至想要的模型名稱上方，點擊左側的「眼睛」圖示來開啟它，其他模型以此類推。</li>
                </ul>
              </div>

              <figure className="tutorial-panel tutorial-panel--media" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="image-placeholder" style={{ border: 'none', borderRadius: '28px' }}>
                  <div>
                    <h3 style={{ color: '#fff', marginBottom: '8px' }}>圖片佔位區</h3>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>放置選擇與啟用模型的截面圖</p>
                  </div>
                </div>
              </figure>
            </div>
          </section>

          <section data-scroll className="tutorial-section timeline-step" id="step-4">
            <div className="tutorial-split tutorial-split--reverse">
              <div className="tutorial-panel tutorial-panel--text">
                <p className="tutorial-section-label">Step 04 呼叫 Copilot Chat</p>
                <h2>開始與 AI 對話</h2>
                <p>萬事俱備，現在您可以在終端機或編輯畫面呼叫您的私人助理了。</p>

                <ul className="tutorial-list">
                  <li><strong>開啟聊天視窗</strong>：按下 <code>Ctrl+Shift+I</code> (或是點擊左側側邊欄的對話圖示) 開啟 Copilot Chat。</li>
                  <li><strong>選擇模型</strong>：在輸入框的右下角或對話框上方的下拉選單中，選取剛剛設定好的模型。</li>
                  <li><strong>發送指令</strong>：開始向強大的模型詢問程式碼問題，享受 AI 的極致輔助！</li>
                </ul>
              </div>

              <figure className="tutorial-panel tutorial-panel--media" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="image-placeholder" style={{ border: 'none', borderRadius: '28px' }}>
                  <div>
                    <h3 style={{ color: '#fff', marginBottom: '8px' }}>圖片佔位區</h3>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>放置 Copilot Chat 開啟後的對話截圖</p>
                  </div>
                </div>
              </figure>
            </div>
          </section>
        </div>

        <footer id="copilot-summary" data-scroll className="tutorial-footer" style={{ paddingTop: '80px' }}>
          <div>
            <strong>VSCode Copilot 環境腳本</strong>
            <p>輕鬆整合本地模型伺服器，釋放強大 AI 協作潛能。</p>
          </div>
          <a href="#top">回到頂部</a>
        </footer>
      </div>
    </>
  );
};

export default Copliot;