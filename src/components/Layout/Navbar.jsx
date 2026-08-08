// src/components/Layout/Navbar.jsx
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { Link as ScrollLink } from 'react-scroll';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import { FaBars, FaShoppingCart, FaTimes, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { IoMdSearch } from 'react-icons/io';
import DarkMode from './DarkMode';
import LanguageSwitcher from './LanguageSwitcher';
import { openCart } from '../../redux/slices/marketplaceSlice';
import { logoutUser } from '../../redux/slices/userSlice';
import { useLanguage } from '../../contexts/LanguageContext';
import BellDropdown from '../Shared/BellDropdown'; // ✅ استيراد المكون الجديد

const NAV_SECTIONS = ['home', 'emergency', 'posts', 'courses', 'services', 'marketplace'];
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/verify-code', '/verify-otp', '/reset-password'];

// ── Icon button with accessible label ─────────────────────────
const IconButton = ({ onClick, ariaLabel, badge, children, className = '' }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className={`relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
      min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 dark:text-gray-300
      ${className}`}
  >
    {children}
    {badge > 0 && (
      <span
        aria-label={`${badge} إشعارات`}
        className="absolute -top-0.5 -end-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none"
      >
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </button>
);

const Navbar = memo(() => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLang } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const userCart = useSelector(s => s.marketplace?.userCart) || [];
  const isAuthenticated = useSelector(s => s.user?.isAuthenticated) || false;
  const roles = useSelector(s => s.user?.roles) || [];

  // ✅ استخدام unreadCount من rescueRequests بدلاً من emergencyNotifications
  const unreadCount = useSelector(s => s.rescueRequests?.unreadCount || 0);

  const cartCount = userCart.length;
  const isRTL = currentLang === 'ar';
  const isMobile = useMediaQuery({ query: '(max-width: 1023px)' });
  const isAuthPage = AUTH_PATHS.includes(location.pathname);
  const isHomePage = location.pathname === '/';

  // ── Active section tracking ─────────────────────────────────
  const updateActiveSection = useCallback(() => {
    if (!isHomePage || isAuthPage) { setActiveSection(null); return; }
    const scrollY = window.scrollY + 150;
    for (const section of NAV_SECTIONS) {
      const el = document.getElementById(section);
      if (!el) continue;
      const top = el.offsetTop;
      const bottom = top + el.offsetHeight;
      if (scrollY >= top && scrollY < bottom) { setActiveSection(section); return; }
    }
  }, [isHomePage, isAuthPage]);

  useEffect(() => {
    if (!isHomePage || isAuthPage) { setActiveSection(null); return; }
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    updateActiveSection();
    return () => window.removeEventListener('scroll', updateActiveSection);
  }, [isHomePage, isAuthPage, updateActiveSection]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const handleLogout = useCallback(async () => {
    await dispatch(logoutUser());
    navigate('/login');
    setUserMenuOpen(false);
    closeMobileMenu();
  }, [dispatch, navigate, closeMobileMenu]);

  // ── NavLink: ScrollLink on home, RouterLink elsewhere ───────
  const NavLink = ({ section, onClick, children }) => {
    const isActive = isHomePage && !isAuthPage && activeSection === section;
    const cls = `px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ${isActive
      ? 'text-primary bg-primary/10'
      : 'text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-primary/5'
      }`;

    if (!isHomePage || isAuthPage) {
      return (
        <RouterLink to={`/#${section}`} className={cls} onClick={onClick}>
          {children}
        </RouterLink>
      );
    }
    return (
      <ScrollLink
        to={section} spy smooth duration={500} offset={-70}
        className={cls}
        href={`#${section}`}
        onClick={(e) => { e.preventDefault(); onClick?.(); }}
      >
        {children}
      </ScrollLink>
    );
  };

  return (
    <>
      <nav
        role="navigation"
        aria-label="القائمة الرئيسية"
        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm border-b border-gray-100 dark:border-gray-800"
      >
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <a href="/" aria-label="E-Help — الصفحة الرئيسية" className="text-primary font-bold text-2xl tracking-tight shrink-0">
            E‑Help
          </a>

          {/* Desktop nav links */}
          {!isMobile && (
            <div className="hidden lg:flex items-center gap-1" role="menubar">
              {NAV_SECTIONS.map(section => (
                <NavLink key={section} section={section}>
                  {t(`nav.${section}`)}
                </NavLink>
              ))}
            </div>
          )}

          {/* Right controls */}
          <div className="flex items-center gap-0.5">
            {/* ✅ زر الجرس مع القائمة المنسدلة */}
            {isAuthenticated && <BellDropdown />}

            {/* Search */}
            {/* <div className="relative hidden md:block">
              <IconButton
                onClick={() => setSearchOpen(v => !v)}
                ariaLabel="فتح البحث"
              >
                <IoMdSearch className="text-xl" />
              </IconButton>
              {searchOpen && (
                <input
                  autoFocus
                  type="search"
                  placeholder={t('common.search') + '...'}
                  aria-label="ابحث في الموقع"
                  className="
                    absolute end-0 top-12 w-64 p-2.5 rounded-xl
                    border border-gray-200 dark:border-gray-700 dark:bg-gray-800
                    shadow-lg text-sm outline-none focus:ring-2 focus:ring-primary/30
                    animate-slide-in-down
                  "
                />
              )}
            </div> */}

            {/* Cart */}
            {/* <IconButton
              onClick={() => dispatch(openCart())}
              ariaLabel={cartCount > 0 ? `سلة المشتريات — ${cartCount} منتجات` : 'سلة المشتريات'}
              badge={cartCount}
            >
              <FaShoppingCart className="text-xl" />
            </IconButton> */}

            <DarkMode />
            <LanguageSwitcher />

            {/* Login button */}
            {!isAuthenticated && !isAuthPage && (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition min-h-[44px]"
              >
                {t('login')}
              </button>
            )}

            {/* User menu */}
            {isAuthenticated && (
              <div className="relative" ref={userMenuRef}>
                <IconButton
                  onClick={() => setUserMenuOpen(v => !v)}
                  ariaLabel="قائمة المستخدم"
                >
                  <FaUserCircle className="text-2xl" />
                </IconButton>

                {userMenuOpen && (
                  <div
                    role="menu"
                    className={`
                      absolute top-12 ${isRTL ? 'left-0' : 'right-0'}
                      w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg
                      border border-gray-100 dark:border-gray-700 py-1.5 z-50
                      animate-slide-in-down
                    `}
                  >
                    {[
                      { label: t('nav.profile', 'الملف الشخصي'), path: '/profile' },
                      { label: t('nav.roleRequests', 'طلبات الأدوار'), path: '/role-requests' },
                      { label: t('nav.trustVerification', 'توثيق الحساب'), path: '/trust-verification' },
                    ].map(({ label, path }) => (
                      <button
                        key={path}
                        role="menuitem"
                        onClick={() => { navigate(path); setUserMenuOpen(false); }}
                        className="w-full text-right px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                    <hr className="my-1 border-gray-100 dark:border-gray-700" />
                    <button
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full text-right px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <FaSignOutAlt /> {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu toggle */}
            {isMobile && (
              <IconButton onClick={() => setMobileMenuOpen(true)} ariaLabel="فتح القائمة">
                <FaBars className="text-xl" />
              </IconButton>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────────────── */}
      {isMobile && mobileMenuOpen && createPortal(
        <div
          className="fixed inset-0 bg-black/50 z-[9999] backdrop-blur-sm"
          onClick={closeMobileMenu}
          aria-modal="true"
          role="dialog"
          aria-label="القائمة الجانبية"
        >
          <div
            className={`fixed top-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl p-5 flex flex-col transition-transform duration-300 ${isRTL ? 'left-0' : 'right-0'}`}
            style={{ zIndex: 10000 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <div className={`flex mb-5 ${isRTL ? 'justify-start' : 'justify-end'}`}>
              <IconButton onClick={closeMobileMenu} ariaLabel="إغلاق القائمة">
                <FaTimes className="text-gray-600 dark:text-gray-300" />
              </IconButton>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-0.5" role="menu">
              {NAV_SECTIONS.map(section => {
                const isActive = isHomePage && !isAuthPage && activeSection === section;
                if (!isHomePage || isAuthPage) {
                  return (
                    <RouterLink
                      key={section}
                      to={`/#${section}`}
                      role="menuitem"
                      onClick={closeMobileMenu}
                      className="py-3 px-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      {t(`nav.${section}`)}
                    </RouterLink>
                  );
                }
                return (
                  <ScrollLink
                    key={section}
                    to={section} smooth duration={500} offset={-70}
                    role="menuitem"
                    onClick={closeMobileMenu}
                    className={`py-3 px-3 rounded-xl text-base font-medium cursor-pointer transition-all ${isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    href={`#${section}`}
                  >
                    {t(`nav.${section}`)}
                  </ScrollLink>
                );
              })}
            </nav>

            {/* User links */}
            {isAuthenticated && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-0.5">
                <button
                  onClick={() => { navigate('/profile'); closeMobileMenu(); }}
                  className="text-right px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                >
                  {t('nav.profile', 'الملف الشخصي')}
                </button>
                <button
                  onClick={() => { navigate('/role-requests'); closeMobileMenu(); }}
                  className="text-right px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                >
                  {t('nav.roleRequests', 'طلبات الأدوار')}
                </button>
                {/* ✅ إضافة BellDropdown في القائمة الجانبية للموبايل */}
                <div className="px-3 py-2">
                  <BellDropdown />
                </div>
              </div>
            )}

            {/* Logout / Login */}
            <div className="mt-auto">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition font-medium"
                >
                  <FaSignOutAlt /> {t('logout')}
                </button>
              ) : !isAuthPage && (
                <button
                  onClick={() => { navigate('/login'); closeMobileMenu(); }}
                  className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-primary text-white font-medium transition"
                >
                  {t('login')}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
});

Navbar.displayName = 'Navbar';
export default Navbar;