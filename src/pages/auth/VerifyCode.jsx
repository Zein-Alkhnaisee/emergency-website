import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { verifyEmailThunk, resendOTPThunk, clearError } from '../../redux/slices/userSlice';
import Toast from '../../components/Toast';

const VerifyCode = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, temp_token, isAuthenticated } = useSelector((state) => state.user);
  const [code, setCode] = useState('');
  const [toast, setToast] = useState(null);
  const [toastKey, setToastKey] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!temp_token && !isAuthenticated) navigate('/register');
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
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setToast({ message: t('enterValidCode'), type: 'error' });
      setToastKey(prev => prev + 1);
      return;
    }
    const result = await dispatch(verifyEmailThunk({ temp_token, verification_code: code }));
    if (verifyEmailThunk.fulfilled.match(result)) {
      setToast({ message: t('accountVerified'), type: 'success' });
      setToastKey(prev => prev + 1);
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
    <div className="text-white h-screen flex items-center justify-center bg-cover" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}emergency-login.png)`, backgroundAttachment:"fixed" }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-slate-800 border border-slate-600 rounded-md p-10 shadow-lg backdrop-blur-lg bg-opacity-30 relative w-[500px]">
        <h1 className="text-4xl font-bold text-center mb-6">{t('verifyEmail')}</h1>
        <p className="text-center text-sm text-gray-300 mb-6">{t('verifyEmailDesc')}</p>
        <form onSubmit={handleSubmit}>
          <div className="relative my-6">
            <input
              type="text"
              maxLength="6"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className={`block w-full py-3 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:text-white focus:border-red-400 peer text-center text-2xl tracking-widest ${code ? 'filled' : ''}`}
              placeholder=" "
              required
              autoFocus
            />
            <label className={`absolute text-sm duration-300 transform -translate -z-10 origin-[0] top-3 ${isRTL ? 'right-0 left-auto' : 'left-0 right-auto'} peer-focus:text-red-100 peer-focus:scale-75 peer-focus:-translate-y-6 ${code ? 'scale-75 -translate-y-6' : 'scale-100 translate-y-0'}`}>
              {t('verificationCode')}
            </label>
          </div>
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full text-lg mt-4 rounded bg-red-500 py-2.5 hover:bg-red-600 transition-colors duration-300 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {t('common.loading')}
              </div>
            ) : t('verify')}
          </button>
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0}
              className="text-red-200 hover:text-red-100 hover:underline text-sm disabled:opacity-50 transition"
            >
              {countdown > 0
                ? `${t('resendIn')} ${countdown} ${t('common.seconds')}`
                : t('resendCode')}
            </button>
          </div>
          <div className="text-center mt-4">
            <Link to="/login" className="text-red-200 hover:text-red-100 hover:underline transition text-sm">{t('back To Login')}</Link>
          </div>
        </form>
      </div>
      {toast && <Toast key={toastKey} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default VerifyCode;