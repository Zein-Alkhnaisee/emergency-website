import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
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
            // ── الأساسيات ──
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

            // ── إضافات جديدة ──
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('react-hook-form')) {
              return 'form';
            }
            if (id.includes('axios')) {
              return 'axios';
            }
            if (id.includes('date-fns')) {
              return 'date-fns';
            }
            if (id.includes('geolib')) {
              return 'geolib';
            }
            if (id.includes('react-lazy-load-image-component')) {
              return 'lazy-images';
            }

            // ── تقسيم الصفحات الكبيرة ──
            if (id.includes('/src/pages/EmergencyPage')) {
              return 'page-emergency';
            }
            if (id.includes('/src/pages/ProfilePage')) {
              return 'page-profile';
            }
            if (id.includes('/src/pages/PostsPage') || id.includes('/src/pages/AllArticlesPage')) {
              return 'page-posts';
            }
            if (id.includes('/src/pages/ServicesPage')) {
              return 'page-services';
            }
            if (id.includes('/src/pages/CoursesPage')) {
              return 'page-courses';
            }
            if (id.includes('/src/pages/MarketplacePage')) {
              return 'page-marketplace';
            }
            if (id.includes('/src/pages/TrustVerificationPage')) {
              return 'page-trust';
            }
            if (id.includes('/src/pages/RoleRequestsPage')) {
              return 'page-roles';
            }
            if (id.includes('/src/pages/NotificationsPage')) {
              return 'page-notifications';
            }
            if (id.includes('/src/pages/ChatPage') || id.includes('/src/pages/EmergencyChatPage')) {
              return 'page-chat';
            }
            if (id.includes('/src/pages/MyCasePage') || id.includes('/src/pages/CaseDetailPage')) {
              return 'page-cases';
            }
            if (id.includes('/src/pages/RescueRequestsPage') || id.includes('/src/pages/RescueRequestDetailPage')) {
              return 'page-rescue';
            }

            // ── أي مكتبة أخرى غير معروفة → `vendor` ──
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          // ✅ تحسين أسماء ملفات الـ CSS لتقليل الحجم
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'assets/css/[name]-[hash].[ext]';
            }
            return 'assets/[ext]/[name]-[hash].[ext]';
          },
        },
      },
      chunkSizeWarningLimit: 500,
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      // ✅ تحسين الـ CSS (تقليل الحجم)
      cssTarget: 'chrome61',
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
        'framer-motion',
        'react-hook-form',
        'axios',
        'date-fns',
        'aos',
        'react-scroll',
        'react-responsive',
        'geolib',
        'react-lazy-load-image-component', // ✅ إضافة
      ],
    },
  };
});