import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPasswordThunk, clearError } from '../../redux/slices/userSlice';
import Toast from '../../components/Toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPassword = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, temp_token, isAuthenticated } = useSelector((state) => state.user);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastKey, setToastKey] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const isRTL = i18n.language === 'ar';

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
    if (password.length >= 8) strength++;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setToast({ message: t('passwordMismatch'), type: 'error' });
      setToastKey(prev => prev + 1);
      return;
    }
    if (passwordStrength < 2) {
      setToast({ message: t('passwordTooWeak'), type: 'error' });
      setToastKey(prev => prev + 1);
      return;
    }
    const result = await dispatch(resetPasswordThunk({ temp_token, password, password_confirmation: passwordConfirmation }));
    if (resetPasswordThunk.fulfilled.match(result)) {
      setToast({ message: t('passwordResetSuccess'), type: 'success' });
      setToastKey(prev => prev + 1);
      setTimeout(() => navigate('/'), 2000);
    }
  };

  return (
    <div className="text-white h-screen flex items-center justify-center bg-cover" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}emergency-login.png)`, backgroundAttachment:"fixed" }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-slate-800 border border-slate-600 rounded-md p-10 shadow-lg backdrop-blur-lg bg-opacity-30 relative w-[500px]">
        <h1 className="text-4xl font-bold text-center mb-6">{t('reset Password')}</h1>
        <p className="text-center text-sm text-gray-300 mb-6">{t('enter New Password')}</p>
        <form onSubmit={handleSubmit}>
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
                {t('new Password')}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute ${isRTL ? 'left-0 right-auto' : 'right-0 left-auto'} top-3 text-sm text-red-300 hover:text-red-100 transition`}
                aria-label={showPassword ? t('hide') : t('show')}
              >
                {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
              </button>
            </div>
            {password && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full ${getStrengthColor()} transition-all duration-300`} style={{ width: `${(passwordStrength / 4) * 100}%` }}></div>
                </div>
                <span className="text-xs text-gray-400">{getStrengthText()}</span>
              </div>
            )}
          </div>

          <div className="relative my-6">
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className={`block w-full py-3 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:text-white focus:border-red-400 peer ${passwordConfirmation ? 'filled' : ''}`}
                placeholder=" "
                required
              />
              <label className={`absolute text-sm duration-300 transform -translate -z-10 origin-[0] top-3 ${isRTL ? 'right-0 left-auto' : 'left-0 right-auto'} peer-focus:text-red-100 peer-focus:scale-75 peer-focus:-translate-y-6 ${passwordConfirmation ? 'scale-75 -translate-y-6' : 'scale-100 translate-y-0'}`}>
                {t('confirm New Password')}
              </label>
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className={`absolute ${isRTL ? 'left-0 right-auto' : 'right-0 left-auto'} top-3 text-sm text-red-300 hover:text-red-100 transition`}
                aria-label={showConfirm ? t('hide') : t('show')}
              >
                {showConfirm ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
              </button>
            </div>
            {passwordConfirmation && password !== passwordConfirmation && (
              <p className="text-red-300 text-xs mt-1">{t('passwordMismatch')}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password || !passwordConfirmation || password !== passwordConfirmation}
            className="w-full text-lg mt-4 rounded bg-red-500 py-2.5 hover:bg-red-600 transition-colors duration-300 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {t('common.loading')}
              </div>
            ) : t('reset')}
          </button>
        </form>
      </div>
      {toast && <Toast key={toastKey} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ResetPassword;