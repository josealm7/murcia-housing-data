import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/murcia-housing-data/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }
          if (id.includes('/node_modules/recharts/')) return 'recharts';
          if (
            id.includes('/node_modules/d3-') ||
            id.includes('/node_modules/victory-vendor/')
          ) {
            return 'chart-vendor';
          }
        },
      },
    },
  },
});
