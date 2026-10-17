import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { forgotPasswordThunk, clearError, clearTempToken } from '../../redux/slices/userSlice';
import Toast from '../../components/Toast';

const ForgotPassword = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, temp_token } = useSelector((state) => state.user);
  const [toast, setToast] = useState(null);
  const [toastKey, setToastKey] = useState(0);
  const isRTL = i18n.language === 'ar';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
    },
  });
  useEffect(() => {
    dispatch(clearTempToken());
  }, [dispatch]);
  useEffect(() => {
    if (temp_token) navigate('/verify-otp');
  }, [temp_token, navigate]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
      setToastKey(prev => prev + 1);
      const timer = setTimeout(() => dispatch(clearError()), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const onSubmit = async (data) => {
    await dispatch(forgotPasswordThunk(data.email));
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
              {t('forgot Password')}
            </h1>
            <p className="text-sm text-gray-300 mt-2">
              {t('forgot Password Desc')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                className={`w-full px-4 py-3 bg-white/15 border rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-transparent transition-all duration-200 ${errors.email ? 'border-red-500 ring-red-500/30' : 'border-white/20'
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[var(--color-primary)]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('sendCode')
              )}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-white hover:text-[var(--color-primary)] transition-colors text-sm">
                {t('back To Login')}
              </Link>
            </div>
          </form>
        </div>
      </div>
      {toast && <Toast key={toastKey} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ForgotPassword;