// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // تحديد الـ base بناءً على متغير البيئة أو الـ mode
  // في Netlify، نضبط VITE_BASE_URL في إعدادات البيئة
  const baseUrl = process.env.VITE_BASE_URL || 
                  (mode === 'github-pages' ? '/emergency-website/' : '/');

  return {
    base: baseUrl,

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
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'react-core';
            }
            if (id.includes('react-router-dom') || id.includes('react-router/')) {
              return 'router';
            }
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux') || id.includes('immer')) {
              return 'redux';
            }
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'leaflet';
            }
            if (id.includes('react-icons')) {
              return 'icons';
            }
            if (id.includes('/aos/')) {
              return 'aos';
            }
            if (id.includes('react-hot-toast')) {
              return 'toast';
            }
            if (id.includes('react-scroll') || id.includes('react-responsive')) {
              return 'ui-libs';
            }
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
      chunkSizeWarningLimit: 500,
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
    },

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
  };
});