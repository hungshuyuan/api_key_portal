import { useEffect } from 'react';
import { getScrollInstance } from './scrollManager';
import '../css/style.css';

const Model = () => {
  useEffect(() => {
    const scroll = getScrollInstance();
    if (scroll && typeof scroll.update === 'function') {
      scroll.update();
    }
  }, []);

  return (
    <>
      <section className="resources-section models-section" id="models" style={{ paddingTop: '12rem' }}>
        <div className="resources-shell fade-in models-shell">
          <div className="resources-header">
            <p className="section-kicker">所有可用模型</p>
            <h2>選擇最適合您任務的模型</h2>
            <p>這包含了開源巨型參數模型與企業級的強大解決方案。</p>
          </div>

          <h3 className="category-title fade-in">大型語言模型 (LLM)</h3>
          <div className="resource-grid">
            <div className="resource-card accent-blue">
              <span className="resource-tag">文字生成對話</span>
              <h3>gpt-oss-120b</h3>
              <p>高達 120B 參數的強大開源語言模型，提供全方位的自然語言理解與生成能力，適合複雜的文字處理與邏輯推論任務。</p>
            </div>

            <div className="resource-card accent-cyan">
              <span className="resource-tag">卓越指令跟隨</span>
              <h3>nemotron-3-super-120b</h3>
              <p>基於 NVIDIA Nemotron 3 架構，同樣具備超凡的 120B 參數，在長文本理解、指令遵循方面具有頂尖水準。</p>
            </div>

            <div className="resource-card accent-blue">
              <span className="resource-tag">超頂規模型</span>
              <h3>mistral-675b</h3>
              <p>Mistral‑675B 是 Mistral AI 於 2025 年底推出的第三代大型語言模型，參數規模為 675 億，這款模型在長上下文（8192 tokens 以上）與多輪對話一致性上顯著提升，且在指令遵從度與零樣本推理上接近 GPT‑4 的水準。</p>
            </div>
          </div>

          <h3 className="category-title fade-in" style={{ marginTop: '50px' }}>語音處理 (ASR & TTS)</h3>
          <div className="resource-grid">
            <div className="resource-card accent-amber">
              <span className="resource-tag">語音轉文字 (ASR)</span>
              <h3>whisper</h3>
              <p>由 OpenAI 開發的先進語音辨識模型，能快速並精確地將人類語音轉換為文字資料，適用於會議記錄或智慧語音助理。</p>
            </div>

            <div className="resource-card accent-blue">
              <span className="resource-tag">文字轉語音 (TTS)</span>
              <h3>fish-speech-server</h3>
              <p>支援強大文字轉音訊輸出的語言服務，能生成自然流暢的人聲，完美結合各類型播報或多媒體語音任務。</p>
            </div>
          </div>

          <h3 className="category-title fade-in" style={{ marginTop: '50px' }}>圖像生成 (生圖)</h3>
          <div className="resource-grid">
            <div className="resource-card accent-cyan">
              <span className="resource-tag">高品質生圖</span>
              <h3>Z-image</h3>
              <p>先進的圖像生成模型，能根據文本提示創建高解析度、細節豐富的圖片，適用於設計與創意工作。</p>
            </div>

            <div className="resource-card accent-cyan">
              <span className="resource-tag">高品質生圖</span>
              <h3>flux</h3>
              <p>先進的圖像生成模型，能根據文本提示創建高解析度、細節豐富的圖片，適用於設計與創意工作。</p>
            </div>
          </div>

          <h3 className="category-title fade-in" style={{ marginTop: '50px' }}>向量資料處理 (Embedding)</h3>
          <div className="resource-grid">
            <div className="resource-card accent-white">
              <span className="resource-tag">向量資料處理</span>
              <h3>embedding</h3>
              <p>用於文本嵌入的高效模型，能將文字轉化為高維向度數據。極為適合知識庫搜尋 (RAG) 和文本相似度應用開發。</p>
            </div>
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
            <a href="/#getting-started">如何開始</a>
            <a href="/#resources">資源入口</a>
            <a href="/#resources">服務入口</a>
            <a href="/#resources">公告中心</a>
          </div>
          <p className="footer-note">打造全校普惠 AI 體驗。</p>
        </div>
      </footer>
    </>
  );
};

export default Model;
