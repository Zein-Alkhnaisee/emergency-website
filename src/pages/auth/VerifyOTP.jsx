import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { verifyOTPThunk, resendOTPThunk, clearError } from '../../redux/slices/userSlice';
import Toast from '../../components/Toast';

const VerifyOTP = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, temp_token } = useSelector((state) => state.user);
  const [otpCode, setOtpCode] = useState('');
  const [toast, setToast] = useState(null);
  const [toastKey, setToastKey] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (!temp_token) navigate('/forgot-password');
  }, [temp_token, navigate]);
  

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
      setToastKey(prev => prev + 1);
      const timer = setTimeout(() => dispatch(clearError()), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setToast({ message: t('enterValidCode'), type: 'error' });
      setToastKey(prev => prev + 1);
      return;
    }
    const result = await dispatch(verifyOTPThunk({ temp_token, otp_code: otpCode }));
    if (verifyOTPThunk.fulfilled.match(result)) {
      navigate('/reset-password');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    await dispatch(resendOTPThunk(temp_token));
    setToast({ message: t('codeResent'), type: 'success' });
    setToastKey(prev => prev + 1);
    setCountdown(60);
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
              {t('verify Code')}
            </h1>
            <p className="text-sm text-gray-300 mt-2">
              {t('verify Code Desc')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                maxLength="6"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-white/15 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-[0.5em]"
                placeholder="000000"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[var(--color-primary)]/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('verify')
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0}
                className="text-white hover:text-[var(--color-primary)] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {countdown > 0
                  ? `${t('resendIn')} ${countdown} ${t('common.seconds')}`
                  : t('resendCode')}
              </button>
            </div>
          </form>
        </div>
      </div>
      {toast && <Toast key={toastKey} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default VerifyOTP;