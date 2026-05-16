import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/portal/',
  plugins: [react()],

  server: {
    host: true, // 允許外部訪問
    port: 5200,
    strictPort: true,

    allowedHosts: [
      "nkustapikey.54ucl.com"
    ],

    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  }
});