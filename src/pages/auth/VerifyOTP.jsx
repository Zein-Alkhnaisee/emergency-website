// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Link, useNavigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// import { verifyOTPThunk, resendOTPThunk, clearError } from '../../redux/slices/userSlice';
// import Toast from '../../components/Toast';

// const VerifyOTP = () => {
//   const { t } = useTranslation();
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { loading, error, temp_token } = useSelector((state) => state.user);
//   const [otpCode, setOtpCode] = useState('');
//   const [toast, setToast] = useState(null);
//   const [countdown, setCountdown] = useState(0);

//   useEffect(() => {
//     if (!temp_token) navigate('/forgot-password');
//   }, [temp_token, navigate]);

//   useEffect(() => {
//     if (error) {
//       setToast({ message: error, type: 'error' });
//       dispatch(clearError());
//     }
//   }, [error, dispatch]);

//   useEffect(() => {
//     if (countdown > 0) {
//       const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [countdown]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!otpCode || otpCode.length !== 6) {
//       setToast({ message: t('enterValidCode'), type: 'error' });
//       return;
//     }
//     const result = await dispatch(verifyOTPThunk({ temp_token, otp_code: otpCode }));
//     if (verifyOTPThunk.fulfilled.match(result)) {
//       navigate('/reset-password');
//     }
//   };

//   const handleResend = async () => {
//     if (countdown > 0) return;
//     await dispatch(resendOTPThunk(temp_token));
//     setToast({ message: t('codeResent'), type: 'success' });
//     setCountdown(60);
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 animate-fadeIn">
//       <div className="w-full max-w-md animate-slideUp">
//         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:shadow-xl">
//           <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white text-center">
//             <h2 className="text-2xl font-bold">{t('verify Code')}</h2>
//             <p className="text-red-100 mt-1">{t('verify Code Desc')}</p>
//           </div>
//           <form onSubmit={handleSubmit} className="p-6 space-y-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('code')}</label>
//               <input
//                 type="text"
//                 maxLength="6"
//                 value={otpCode}
//                 onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
//                 className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 outline-none"
//                 placeholder="000000"
//                 autoFocus
//               />
//               <p className="text-xs text-gray-500 mt-2">{t('codeHint')}</p>
//             </div>
//             <button
//               type="submit"
//               disabled={loading || otpCode.length !== 6}
//               className="w-full py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 bg-red-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed btn-ripple"
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center gap-2">
//                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   {t('common.loading')}
//                 </span>
//               ) : t('verify')}
//             </button>
//             <div className="text-center">
//               <button
//                 type="button"
//                 onClick={handleResend}
//                 disabled={countdown > 0}
//                 className={`text-sm transition ${countdown > 0 ? 'text-gray-400' : 'text-red-600 hover:underline'}`}
//               >
//                 {countdown > 0
//                   ? `${t('resendIn')} ${countdown} ${t('common.seconds')}`
//                   : t('resendCode')}
//               </button>
//               <div className="text-center mt-4">
//                 <Link to="/login" className="text-sm text-red-600 hover:underline transition">{t('back To Login')}</Link>
//               </div>
//             </div>
//           </form>
//         </div>
//       </div>
//       {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
//     </div>
//   );
// };
// export default VerifyOTP;
import { useState, useEffect } from 'react';
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
    <div className="text-white h-screen flex items-center justify-center bg-cover" style={{ backgroundImage: "url(/emergency-login.png)", backgroundAttachment:"fixed" }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-slate-800 border border-slate-600 rounded-md p-10 shadow-lg backdrop-blur-lg bg-opacity-30 relative w-[500px]">
        <h1 className="text-4xl font-bold text-center mb-6">{t('verify Code')}</h1>
        <p className="text-center text-sm text-gray-300 mb-6">{t('verify Code Desc')}</p>
        <form onSubmit={handleSubmit}>
          <div className="relative my-6">
            <input
              type="text"
              maxLength="6"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className={`block w-full py-3 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:text-white focus:border-red-400 peer text-center text-2xl tracking-widest ${otpCode ? 'filled' : ''}`}
              placeholder=" "
              required
              autoFocus
            />
            <label className={`absolute text-sm duration-300 transform -translate -z-10 origin-[0] top-3 ${isRTL ? 'right-0 left-auto' : 'left-0 right-auto'} peer-focus:text-red-100 peer-focus:scale-75 peer-focus:-translate-y-6 ${otpCode ? 'scale-75 -translate-y-6' : 'scale-100 translate-y-0'}`}>
              {t('code')}
            </label>
          </div>
          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
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
        </form>
      </div>
      {toast && <Toast key={toastKey} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default VerifyOTP;