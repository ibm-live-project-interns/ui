import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@carbon/react', '@carbon/icons-react', '@carbon/charts-react'],
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Silence deprecation warnings from Carbon Design System internals
        silenceDeprecations: ['if-function'],
      },
    },
  },
  server: {
    // Improve HMR stability by pre-transforming common modules
    warmup: {
      clientFiles: [
        './src/components/layout/index.ts',
        './src/components/index.ts',
        './src/constants/index.ts',
        './src/services/index.ts',
        './src/hooks/*.ts',
      ],
    },
    // Increase HMR timeout for slower connections
    hmr: {
      timeout: 5000,
    },
  },
});
