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
    // Pre-bundle heavy dependencies to avoid slow first load
    include: [
      '@carbon/react',
      '@carbon/icons-react',
      '@carbon/charts-react',
      'react',
      'react-dom',
      'react-router-dom',
    ],
    // Exclude from optimization if causing issues
    exclude: [],
  },
  build: {
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Carbon UI components
          'vendor-carbon': ['@carbon/react', '@carbon/icons-react'],
          // Carbon charts (heavy, separate chunk)
          'vendor-charts': ['@carbon/charts-react'],
        },
      },
    },
    // Increase chunk size warning limit for Carbon
    chunkSizeWarningLimit: 1000,
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['if-function'],
      },
    },
  },
  server: {
    warmup: {
      clientFiles: [
        './src/components/layout/index.ts',
        './src/pages/welcome/index.tsx',
        './src/pages/auth/login/index.tsx',
      ],
    },
    hmr: {
      timeout: 5000,
    },
  },
});
