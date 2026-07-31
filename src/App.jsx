import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import 'aos/dist/aos.css';
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from './components/Layout/Navbar';
import MyArticlesPage from './pages/MyArticlesPage';
import MyCommentsPage from './pages/MyCommentsPage';
import { Toaster } from 'react-hot-toast';
import RoleRequestsPage from './pages/RoleRequestsPage';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './redux/slices/userSlice';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import EmergencyChatPage from './pages/EmergencyChatPage';
import MyCasePage from './pages/MyCasePage';
import TrustVerificationPage from './pages/TrustVerificationPage';
import LiveNotificationCenter from './components/Notifications/LiveNotificationCenter';

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
const VerifyOTP = lazy(() => import('./pages/auth/VerifyOtp'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

function App() {
  const dispatch = useDispatch();
  // isAuthenticated is derived from localStorage token presence at startup
  const isAuthenticated = useSelector(state => state.user.isAuthenticated);

  // Init AOS
  useEffect(() => {
    import('aos').then((AOS) => {
      AOS.default.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 80 });
    }).catch(err => console.warn('AOS init failed:', err));
  }, []);

  // On mount: if we have a stored token, validate it and refresh user/roles data
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && storedToken !== 'undefined') {
      dispatch(fetchMe());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  return (
    <LanguageProvider>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3500,
          style: { borderRadius: '12px', fontFamily: 'Tajawal, sans-serif' },
        }}
      />
      {isAuthenticated && <LiveNotificationCenter />}
      <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white transition-colors min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Suspense fallback={
            <div className="h-screen flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">جاري التحميل...</p>
            </div>
          }>
            <Routes>
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

              <Route path="*" element={<Navigate to="/" replace />} />


              <Route path="/trust-verification" element={<ProtectedRoute><TrustVerificationPage /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </LanguageProvider>
  );
}

export default App;
