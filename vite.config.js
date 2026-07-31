import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api': {
        target: 'https://emergency-grad.duckdns.org',
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: { overlay: false },
  },

  build: {
    // تقليل حجم الـ bundle النهائي
    target: 'es2020',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.info'],
        passes: 2,
      },
      mangle: { toplevel: true },
    },
    // تقسيم الـ chunks بشكل أفضل لتحسين LCP
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — يُحمَّل أولاً دائماً
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          // Router
          if (id.includes('react-router-dom') || id.includes('react-router/')) {
            return 'router';
          }
          // Redux
          if (id.includes('@reduxjs/toolkit') || id.includes('react-redux') || id.includes('immer')) {
            return 'redux';
          }
          // i18n — لا يؤثر على LCP
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n';
          }
          // Leaflet (الخرائط) — كبير جداً، يُحمَّل lazy
          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'leaflet';
          }
          // أيقونات — كبير، يُقسَّم
          if (id.includes('react-icons')) {
            return 'icons';
          }
          // AOS animations
          if (id.includes('/aos/')) {
            return 'aos';
          }
          // Hot toast
          if (id.includes('react-hot-toast')) {
            return 'toast';
          }
          // react-scroll
          if (id.includes('react-scroll') || id.includes('react-responsive')) {
            return 'ui-libs';
          }
          // باقي node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // أسماء ملفات ثابتة للـ caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 500,
    // تقليل حجم الـ CSS
    cssCodeSplit: true,
    // تحسين الصور
    assetsInlineLimit: 4096, // inline الصور الصغيرة أقل من 4kb
  },

  // تحسين الـ dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'react-i18next',
      'i18next',
      'react-hot-toast',
      'leaflet',
      'react-leaflet',
    ],
  },
});