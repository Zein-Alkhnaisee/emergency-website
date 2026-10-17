import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import 'aos/dist/aos.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Layout/Navbar';
import Breadcrumbs from './components/UI/Breadcrumbs';
import ErrorBoundary from './components/UI/ErrorBoundary';
import { Toaster } from 'react-hot-toast'; 
import MyArticlesPage from './pages/MyArticlesPage';
import MyCommentsPage from './pages/MyCommentsPage';
import RoleRequestsPage from './pages/RoleRequestsPage';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './redux/slices/userSlice';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import EmergencyChatPage from './pages/EmergencyChatPage';
import MyCasePage from './pages/MyCasePage';
import TrustVerificationPage from './pages/TrustVerificationPage';
import LiveNotificationCenter from './components/Notifications/LiveNotificationCenter';
import AllArticlesPage from './pages/AllArticlesPage';
import PostDetailPage from './pages/PostDetailPage';
import RescueRequestsPage from './pages/RescueRequestsPage';
import RescueRequestDetailPage from './pages/RescueRequestDetailPage';
import CaseDetailPage from './pages/CaseDetailPage';
import GroupMembersPage from './pages/GroupMembersPage';
import EmergencyCasesHubPage from './pages/EmergencyCasesHubPage';
import MyReportsPage from './pages/MyReportsPage';

// Route guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.user);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.user);
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

// Lazy pages
const HomePage = lazy(() => import('./pages/HomePage'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const VerifyCode = lazy(() => import('./pages/auth/VerifyCode'));
const VerifyOTP = lazy(() => import('./pages/auth/VerifyOTP'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const isAuthenticated = useSelector(state => state.user.isAuthenticated);

  // Init AOS
  useEffect(() => {
    import('aos').then((AOS) => {
      AOS.default.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 80 });
    }).catch(err => console.warn('AOS init failed:', err));
  }, []);

  // On mount: validate token
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && storedToken !== 'undefined') {
      dispatch(fetchMe());
    }
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        {/* ✅ Toaster محسّن للموبايل */}
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              fontFamily: 'Tajawal, sans-serif',
              maxWidth: '90vw',
            },
            className: 'react-hot-toast-custom',
          }}
          containerStyle={{
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          gutter={8}
        />
        {isAuthenticated && <LiveNotificationCenter />}
        <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white transition-colors duration-300 min-h-screen flex flex-col">
          <Navbar />

          {/* Breadcrumbs - تظهر في جميع الصفحات ما عدا الرئيسية */}
          {location.pathname !== '/' && <Breadcrumbs />}

          <main className="flex-grow">
            <ErrorBoundary>
              <Suspense fallback={
                <div className="h-screen flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400 text-sm">جاري التحميل...</p>
                </div>
              }>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <Routes location={location}>
                      {/* Public auth pages */}
                      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
                      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
                      <Route path="/verify-code" element={<PublicOnlyRoute><VerifyCode /></PublicOnlyRoute>} />
                      <Route path="/verify-otp" element={<PublicOnlyRoute><VerifyOTP /></PublicOnlyRoute>} />
                      <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />

                      {/* Public home */}
                      <Route path="/" element={<HomePage />} />

                      {/* Protected pages */}
                      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                      <Route path="/my-articles" element={<ProtectedRoute><MyArticlesPage /></ProtectedRoute>} />
                      <Route path="/my-comments" element={<ProtectedRoute><MyCommentsPage /></ProtectedRoute>} />
                      <Route path="/role-requests" element={<ProtectedRoute><RoleRequestsPage /></ProtectedRoute>} />
                      <Route path="/emergency-chat" element={<ProtectedRoute><EmergencyChatPage /></ProtectedRoute>} />
                      <Route path="/my-case" element={<ProtectedRoute><MyCasePage /></ProtectedRoute>} />


                      <Route path="/emergency/rescue-requests" element={<ProtectedRoute><RescueRequestsPage /></ProtectedRoute>} />
                      <Route path="/emergency/rescue-requests/:id" element={<ProtectedRoute><RescueRequestDetailPage /></ProtectedRoute>} />
                      <Route path="/all-articles" element={<AllArticlesPage />} />
                      <Route path="/post/:id" element={<PostDetailPage />} />
                      <Route path="/trust-verification" element={<ProtectedRoute><TrustVerificationPage /></ProtectedRoute>} />

                      <Route path="/emergency/cases-hub" element={<ProtectedRoute><EmergencyCasesHubPage /></ProtectedRoute>} />

                      <Route path="/emergency/cases/:id" element={<ProtectedRoute><CaseDetailPage /></ProtectedRoute>} />
                      <Route path="/group-members" element={<ProtectedRoute><GroupMembersPage /></ProtectedRoute>} />

                      <Route path="/my-reports" element={<ProtectedRoute><MyReportsPage /></ProtectedRoute>} />

                      <Route path="*" element={<Navigate to="/" replace />} />


                    </Routes>
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;