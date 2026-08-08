import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginUser, clearError } from '../../redux/slices/userSlice';
import Toast from '../../components/Toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastKey, setToastKey] = useState(0);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
      setToastKey(prev => prev + 1);
      const timer = setTimeout(() => dispatch(clearError()), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setToast({ message: t('fillAllFields'), type: 'error' });
      setToastKey(prev => prev + 1);
      return;
    }
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      setToast({ message: t('loginSuccess'), type: 'success' });
      setToastKey(prev => prev + 1);
    }
  };

  return (
    <div className="text-white h-screen flex items-center justify-center bg-cover" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}emergency-login.png)`, backgroundAttachment: "fixed" }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-slate-800 border border-slate-600 rounded-md p-10 shadow-lg backdrop-blur-lg bg-opacity-30 relative w-[500px]">
        <h1 className="text-4xl font-bold text-center mb-8">{t('login')}</h1>
        <form onSubmit={handleSubmit}>
          <div className="relative my-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`block w-full py-3 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:text-white focus:border-red-400 peer ${email ? 'filled' : ''}`}
              placeholder=" "
              required
            />
            <label className={`absolute text-sm duration-300 transform -translate -z-10 origin-[0] top-3 ${isRTL ? 'right-0 left-auto' : 'left-0 right-auto'} peer-focus:text-red-100 peer-focus:scale-75 peer-focus:-translate-y-6 ${email ? 'scale-75 -translate-y-6' : 'scale-100 translate-y-0'}`}>
              {t('email')}
            </label>
          </div>

          <div className="relative my-6">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`block w-full py-3 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:text-white focus:border-red-400 peer ${password ? 'filled' : ''}`}
                placeholder=" "
                required
              />
              <label className={`absolute text-sm duration-300 transform -translate -z-10 origin-[0] top-3 ${isRTL ? 'right-0 left-auto' : 'left-0 right-auto'} peer-focus:text-red-100 peer-focus:scale-75 peer-focus:-translate-y-6 ${password ? 'scale-75 -translate-y-6' : 'scale-100 translate-y-0'}`}>
                {t('password')}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute ${isRTL ? 'left-0 right-auto' : 'right-0 left-auto'} top-3 text-sm text-red-300 hover:text-red-100 transition`}
                aria-label={showPassword ? t('hide') : t('show')}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm mb-6">
            <Link to="/forgot-password" className="text-red-200 hover:text-red-100 hover:underline transition">{t('forgot Password')}</Link>
            <Link to="/register" className="text-red-200 hover:text-red-100 hover:underline transition">{t('create Account')}</Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full text-lg mt-4 rounded bg-red-500 py-2.5 hover:bg-red-600 transition-colors duration-300 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {t('common.loading')}
              </div>
            ) : t('login')}
          </button>
        </form>
      </div>
      {toast && <Toast key={toastKey} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Login;