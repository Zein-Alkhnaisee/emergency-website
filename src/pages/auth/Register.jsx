// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate, Link } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// import { registerUser, clearError } from '../../redux/slices/userSlice';
// import Toast from '../../components/Toast';

// const Register = () => {
//   const { t } = useTranslation();
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { loading, error, temp_token } = useSelector((state) => state.user);
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [passwordConfirmation, setPasswordConfirmation] = useState('');
//   const [toast, setToast] = useState(null);
//   const [toastKey, setToastKey] = useState(0);

//   useEffect(() => {
//     if (temp_token) navigate('/verify-code');
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
//     if (!name || !email || !password || !passwordConfirmation) {
//       setToast({ message: t('fillAllFields'), type: 'error' });
//       setToastKey(prev => prev + 1);
//       return;
//     }
//     if (password !== passwordConfirmation) {
//       setToast({ message: t('passwordMismatch'), type: 'error' });
//       setToastKey(prev => prev + 1);
//       return;
//     }
//     await dispatch(registerUser({ name, email, password, password_confirmation: passwordConfirmation }));
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 animate-fadeIn">
//       <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:shadow-xl animate-slideUp">
//         <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white text-center">
//           <h2 className="text-2xl font-bold">{t('register')}</h2>
//         </div>
//         <form onSubmit={handleSubmit} className="p-6 space-y-5">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('name')}</label>
//             <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 transition outline-none" required disabled={loading} />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
//             <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 transition outline-none" required disabled={loading} />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('password')}</label>
//             <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 transition outline-none" required disabled={loading} />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('confirmPassword')}</label>
//             <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} className="mt-1 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 transition outline-none" required disabled={loading} />
//           </div>
//           <div className="flex items-center justify-between">
//             <Link to="/login" className="text-sm text-red-600 hover:underline transition">{t('already Have Account')}</Link>
//           </div>
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 bg-red-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed btn-ripple"
//           >
//             {loading ? (
//               <span className="flex items-center justify-center gap-2">
//                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                 </svg>
//                 {t('common.loading')}
//               </span>
//             ) : t('register')}
//           </button>
//         </form>
//       </div>
//       {toast && <Toast key={toastKey} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
//     </div>
//   );
// };
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { registerUser, clearError } from '../../redux/slices/userSlice';
import Toast from '../../components/Toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, temp_token } = useSelector((state) => state.user);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastKey, setToastKey] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (temp_token) navigate('/verify-code');
  }, [temp_token, navigate]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
      setToastKey(prev => prev + 1);
      const timer = setTimeout(() => dispatch(clearError()), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // حساب قوة كلمة المرور
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
    if (!name || !email || !password || !passwordConfirmation) {
      setToast({ message: t('fillAllFields'), type: 'error' });
      setToastKey(prev => prev + 1);
      return;
    }
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
    await dispatch(registerUser({ name, email, password, password_confirmation: passwordConfirmation }));
  };

  return (
    <div className="text-white h-screen flex items-center justify-center bg-cover" style={{ backgroundImage: "url(/emergency-login.png)", backgroundAttachment: "fixed" }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-slate-800 border border-slate-600 rounded-md p-10 shadow-lg backdrop-blur-lg bg-opacity-30 relative w-[500px]">
        <h1 className="text-4xl font-bold text-center mb-8">{t('register')}</h1>
        <form onSubmit={handleSubmit}>
          <div className="relative my-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`block w-full py-3 px-0 text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:text-white focus:border-red-400 peer ${name ? 'filled' : ''}`}
              placeholder=" "
              required
            />
            <label className={`absolute text-sm duration-300 transform -translate -z-10 origin-[0] top-3 ${isRTL ? 'right-0 left-auto' : 'left-0 right-auto'} peer-focus:text-red-100 peer-focus:scale-75 peer-focus:-translate-y-6 ${name ? 'scale-75 -translate-y-6' : 'scale-100 translate-y-0'}`}>
              {t('name')}
            </label>
          </div>

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

          {/* حقل كلمة المرور مع مقياس القوة */}
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
                {t('confirmPassword')}
              </label>
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className={`absolute ${isRTL ? 'left-0 right-auto' : 'right-0 left-auto'} top-3 text-sm text-red-300 hover:text-red-100 transition`}
                aria-label={showConfirm ? t('hide') : t('show')}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {passwordConfirmation && password !== passwordConfirmation && (
              <p className="text-red-300 text-xs mt-1">{t('passwordMismatch')}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm mb-6">
            <Link to="/login" className="text-red-200 hover:text-red-100 hover:underline transition">{t('already Have Account')}</Link>
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
            ) : t('register')}
          </button>
        </form>
      </div>
      {toast && <Toast key={toastKey} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Register;