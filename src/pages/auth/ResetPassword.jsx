import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { resetPasswordThunk, clearError } from '../../redux/slices/userSlice';
import Toast from '../../components/Toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPassword = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, temp_token, isAuthenticated } = useSelector((state) => state.user);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [toast, setToast] = useState(null);
  const [toastKey, setToastKey] = useState(0);
  const isRTL = i18n.language === 'ar';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      password: '',
      password_confirmation: '',
    },
  });

  const password = watch('password');

  useEffect(() => {
    if (!temp_token && !isAuthenticated) navigate('/forgot-password');
    if (isAuthenticated) navigate('/');
  }, [temp_token, isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
      setToastKey(prev => prev + 1);
      const timer = setTimeout(() => dispatch(clearError()), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    let strength = 0;
    if (password?.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-orange-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 1) return t('weak');
    if (passwordStrength === 2) return t('fair');
    if (passwordStrength === 3) return t('good');
    return t('strong');
  };

  const onSubmit = async (data) => {
    const result = await dispatch(resetPasswordThunk({
      temp_token,
      password: data.password,
      password_confirmation: data.password_confirmation,
    }));
    if (resetPasswordThunk.fulfilled.match(result)) {
      setToast({ message: t('passwordResetSuccess'), type: 'success' });
      setToastKey(prev => prev + 1);
      setTimeout(() => navigate('/'), 2000);
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
              {t('reset Password')}
            </h1>
            <p className="text-sm text-gray-300 mt-2">
              {t('enter New Password')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Password Field */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: t('passwordRequired', 'كلمة المرور مطلوبة'),
                  minLength: {
                    value: 8,
                    message: t('passwordMinLength', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
                  },
                  pattern: {
                    value: /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).*$/,
                    message: t('passwordComplexity', 'يجب أن تحتوي على حرف كبير ورقم ورمز خاص'),
                  },
                })}
                className={`w-full px-4 py-3 bg-white/15 border rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-transparent transition-all duration-200 ${
                  errors.password ? 'border-red-500 ring-red-500/30' : 'border-white/20'
                } ${isRTL ? 'pl-12' : 'pr-12'}`}
                placeholder={t('new Password')}
                autoFocus
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
              {password && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${getStrengthColor()} transition-all duration-300`} style={{ width: `${(passwordStrength / 4) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-300">{getStrengthText()}</span>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                {...register('password_confirmation', {
                  required: t('confirmPasswordRequired', 'تأكيد كلمة المرور مطلوب'),
                  validate: (value) => value === password || t('passwordMismatch', 'كلمتا المرور غير متطابقتين'),
                })}
                className={`w-full px-4 py-3 bg-white/15 border rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-transparent transition-all duration-200 ${
                  errors.password_confirmation ? 'border-red-500 ring-red-500/30' : 'border-white/20'
                } ${isRTL ? 'pl-12' : 'pr-12'}`}
                placeholder={t('confirm New Password')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className={`absolute inset-y-0 ${isRTL ? 'left-3' : 'right-3'} flex items-center text-gray-300 hover:text-white transition-colors`}
                aria-label={showConfirm ? t('hide') : t('show')}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
              {errors.password_confirmation && (
                <p className="text-red-400 text-xs mt-1 animate-fade-up">
                  {errors.password_confirmation.message}
                </p>
              )}
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
                t('reset')
              )}
            </button>
          </form>
        </div>
      </div>
      {toast && <Toast key={toastKey} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ResetPassword;