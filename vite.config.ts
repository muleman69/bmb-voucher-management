import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    sourcemap: true,
    outDir: 'dist'
  },
  server: {
    port: 5173,
    strictPort: true
  },
  optimizeDeps: {
    include: [
      '@mailchimp/mailchimp_marketing',
      'qrcode',
      'react-hot-toast',
      'md5'
    ],
    exclude: ['lucide-react']
  }
});