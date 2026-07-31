// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate, Link } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// import { forgotPasswordThunk, clearError } from '../../redux/slices/userSlice';
// import Toast from '../../components/Toast';

// const ForgotPassword = () => {
//   const { t } = useTranslation();
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { loading, error, temp_token } = useSelector((state) => state.user);
//   const [email, setEmail] = useState('');
//   const [toast, setToast] = useState(null);
//   const [toastKey, setToastKey] = useState(0);

//   useEffect(() => {
//     if (temp_token) navigate('/verify-otp');
//   }, [temp_token, navigate]);

//   useEffect(() => {
//     if (error) {
//       setToast({ message: error, type: 'error' });
//       setToastKey(prev => prev + 1);
//       const timer = setTimeout(() => dispatch(clearError()), 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [error, dispatch]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!email) {
//       setToast({ message: t('enterEmail'), type: 'error' });
//       setToastKey(prev => prev + 1);
//       return;
//     }
//     await dispatch(forgotPasswordThunk(email));
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 animate-fadeIn">
//       <div className="w-full max-w-md animate-slideUp">
//         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:shadow-xl">
//           <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white text-center">
//             <h2 className="text-2xl font-bold">{t('forgot Password')}</h2>
//             <p className="text-red-100 mt-1">{t('forgot Password Desc')}</p>
//           </div>
//           <form onSubmit={handleSubmit} className="p-6 space-y-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email')}</label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 outline-none"
//                 placeholder={t('email Placeholder')}
//                 required
//                 autoFocus
//               />
//             </div>
//             <button
//               type="submit"
//               disabled={loading}
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
//               ) : t('sendCode')}
//             </button>
//             <div className="text-center">
//               <Link to="/login" className="text-sm text-red-600 hover:underline transition">{t('back To Login')}</Link>
//             </div>
//           </form>
//         </div>
//       </div>
//       {toast && <Toast key={toastKey} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
//     </div>
//   );
// };
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPasswordThunk, clearError } from '../../redux/slices/userSlice';
import Toast from '../../components/Toast';

const ForgotPassword = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, temp_token } = useSelector((state) => state.user);
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState(null);
  const [toastKey, setToastKey] = useState(0);
  const isRTL = i18n.language === 'ar';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setToast({ message: t('enterEmail'), type: 'error' });
      setToastKey(prev => prev + 1);
      return;
    }
    await dispatch(forgotPasswordThunk(email));
  };

  return (
    <div className="text-white h-screen flex items-center justify-center bg-cover" style={{ backgroundImage: "url(/emergency-login.png)", backgroundAttachment:"fixed"}} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-slate-800 border border-slate-600 rounded-md p-10 shadow-lg backdrop-blur-lg bg-opacity-30 relative w-[500px]">
        <h1 className="text-4xl font-bold text-center mb-6">{t('forgot Password')}</h1>
        <p className="text-center text-sm text-gray-300 mb-6">{t('forgot Password Desc')}</p>
        <form onSubmit={handleSubmit}>
          <div className="relative my-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`block w-full py-3 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:text-white focus:border-red-400 peer ${email ? 'filled' : ''}`}
              placeholder=" "
              required
              autoFocus
            />
            <label className={`absolute text-sm duration-300 transform -translate -z-10 origin-[0] top-3 ${isRTL ? 'right-0 left-auto' : 'left-0 right-auto'} peer-focus:text-red-100 peer-focus:scale-75 peer-focus:-translate-y-6 ${email ? 'scale-75 -translate-y-6' : 'scale-100 translate-y-0'}`}>
              {t('email')}
            </label>
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
            ) : t('sendCode')}
          </button>
          <div className="text-center mt-6">
            <Link to="/login" className="text-red-200 hover:text-red-100 hover:underline transition text-sm">{t('back To Login')}</Link>
          </div>
        </form>
      </div>
      {toast && <Toast key={toastKey} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ForgotPassword;