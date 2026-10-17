import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { loginUser, clearError, clearTempToken } from '../../redux/slices/userSlice';
import Toast from '../../components/Toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.user);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastKey, setToastKey] = useState(0);
  const isRTL = i18n.language === 'ar';

  // ✅ مسح أي temp_token عالق عند تحميل صفحة تسجيل الدخول
  useEffect(() => {
    dispatch(clearTempToken());
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

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

  const onSubmit = async (data) => {
    const result = await dispatch(loginUser({ email: data.email, password: data.password }));
    if (loginUser.fulfilled.match(result)) {
      setToast({ message: t('loginSuccess'), type: 'success' });
      setToastKey(prev => prev + 1);
    } else {
      setToast({ message: result.payload || t('loginError'), type: 'error' });
      setToastKey(prev => prev + 1);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.29), rgba(127, 29, 29, 0.30)), url(${import.meta.env.BASE_URL}emergency-login.png)` }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-lg animate-slide-in-up">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-10 shadow-2xl border border-white/15 dark:border-gray-600/30">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {t('login')}
            </h1>
            <p className="text-sm text-gray-300 mt-1">
              {t('auth.welcomeBack')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="relative">
              <input
                type="email"
                {...register('email', {
                  required: t('emailRequired', 'البريد الإلكتروني مطلوب'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('emailInvalid', 'البريد الإلكتروني غير صالح'),
                  },
                })}
                className={`w-full px-4 py-3 bg-white/15 border rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-transparent transition-all duration-200 ${
                  errors.email ? 'border-red-500 ring-red-500/30' : 'border-white/20'
                }`}
                placeholder={t('email')}
                autoFocus
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1 animate-fade-up">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: t('passwordRequired', 'كلمة المرور مطلوبة'),
                  minLength: {
                    value: 6,
                    message: t('passwordMinLength', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
                  },
                })}
                className={`w-full px-4 py-3 bg-white/15 border rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-transparent transition-all duration-200 ${
                  errors.password ? 'border-red-500 ring-red-500/30' : 'border-white/20'
                } ${isRTL ? 'pl-12' : 'pr-12'}`}
                placeholder={t('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 ${isRTL ? 'left-3' : 'right-3'} flex items-center text-gray-300 hover:text-white transition-colors`}
                aria-label={showPassword ? t('hide') : t('show')}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1 animate-fade-up">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link to="/forgot-password" className="text-white hover:text-[var(--color-primary)] transition-colors">
                {t('forgot Password')}
              </Link>
              <Link to="/register" className="text-white hover:text-[var(--color-primary)] transition-colors">
                {t('create Account')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[var(--color-primary)]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting || loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('login')
              )}
            </button>
          </form>
        </div>
      </div>
      {toast && <Toast key={toastKey} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Login;