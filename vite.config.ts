import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // `npm run dev` (Vite) + `npm run dev:worker` (wrangler, port 8787) side by side
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});
