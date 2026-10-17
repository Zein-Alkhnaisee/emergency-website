import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link as ScrollLink } from 'react-scroll';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { FaFlag } from 'react-icons/fa';
import { useMediaQuery } from 'react-responsive';
import {
  FaBars,
  FaSignOutAlt,
  FaUserCircle,
  FaHome,
  FaExclamationTriangle,
  FaNewspaper,
  FaGraduationCap,
  FaConciergeBell,
  FaStore,
  FaChevronLeft,
  FaChevronRight,
  FaUserCog,
  FaShieldAlt,
  FaClipboardList,
  FaUser,
  FaPalette,
} from 'react-icons/fa';
import DarkMode from './DarkMode';
import LanguageSwitcher from './LanguageSwitcher';
import { logoutUser } from '../../redux/slices/userSlice';
import { useLanguage } from '../../contexts/LanguageContext';
import BellDropdown from '../Shared/BellDropdown';
import { useTheme, PRIMARY_COLORS } from '../../contexts/ThemeContext';

// ── ثوابت خارج المكون ──
const NAV_SECTIONS = [
  { key: 'home', icon: <FaHome className="text-lg" />, label: 'nav.home' },
  { key: 'emergency', icon: <FaExclamationTriangle className="text-lg" />, label: 'nav.emergency' },
  { key: 'posts', icon: <FaNewspaper className="text-lg" />, label: 'nav.posts' },
  { key: 'courses', icon: <FaGraduationCap className="text-lg" />, label: 'nav.courses' },
  { key: 'services', icon: <FaConciergeBell className="text-lg" />, label: 'nav.services' },
  { key: 'marketplace', icon: <FaStore className="text-lg" />, label: 'nav.marketplace' },
];

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/verify-code', '/verify-otp', '/reset-password'];

// ── Icon button ──
const IconButton = memo(({ onClick, ariaLabel, badge, children, className = '' }) => {
  const handleClick = useCallback((e) => {
    onClick?.(e);
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      aria-label={ariaLabel}
      className={`relative p-2 rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200
        min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 dark:text-gray-300
        focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40
        ${className}`}
    >
      {children}
      {badge > 0 && (
        <span
          className="absolute -top-0.5 -end-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none"
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
});
IconButton.displayName = 'IconButton';

// ── User Sidebar Link ──
const UserSidebarLink = memo(({ icon, label, path, onClick, navigate, closeSidebar }) => {
  const handleClick = useCallback(() => {
    navigate(path);
    onClick?.();
    closeSidebar();
  }, [navigate, path, onClick, closeSidebar]);

  return (
    <li>
      <button
        onClick={handleClick}
        className="flex items-center gap-3 px-4 py-3 w-full text-right rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 group"
      >
        <span className="text-[var(--color-primary)] text-lg transition-colors duration-200 group-hover:scale-110">{icon}</span>
        <span className="text-sm font-medium transition-colors duration-200">{label}</span>
      </button>
    </li>
  );
});
UserSidebarLink.displayName = 'UserSidebarLink';

// ── NavLink ──
const NavLink = memo(({ section, onClick, children, isHomePage, isAuthPage, activeSection }) => {
  const isActive = isHomePage && !isAuthPage && activeSection === section;
  const cls = `px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ${isActive
    ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10'
    : 'text-gray-700 dark:text-gray-300 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5'
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
      to={section}
      spy
      smooth
      duration={500}
      offset={-70}
      className={cls}
      href={`#${section}`}
      onClick={(e) => { e.preventDefault(); onClick?.(); }}
    >
      {children}
    </ScrollLink>
  );
});
NavLink.displayName = 'NavLink';

// ── Mobile Drawer Link ──
const MobileDrawerLink = memo(({ section, icon, label, isHomePage, isAuthPage, activeSection, closeMenu, location, t }) => {
  const isActive = isHomePage && !isAuthPage && activeSection === section;

  if (isHomePage && !isAuthPage) {
    return (
      <li>
        <ScrollLink
          to={section}
          spy
          smooth
          duration={500}
          offset={-70}
          onClick={closeMenu}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${isActive
            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80'
            }`}
        >
          <span className={`text-[var(--color-primary)] ${isActive ? '' : 'opacity-70'}`}>{icon}</span>
          <span className={`text-sm font-medium ${isActive ? 'text-[var(--color-primary)]' : 'text-gray-600 dark:text-gray-300'}`}>
            {t(label)}
          </span>
          {isActive && <span className="mr-auto w-1.5 h-6 rounded-full bg-[var(--color-primary)]" />}
        </ScrollLink>
      </li>
    );
  }
  return (
    <li>
      <RouterLink
        to={`/#${section}`}
        onClick={closeMenu}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname === `/#${section}`
          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80'
          }`}
      >
        <span className={`text-[var(--color-primary)] ${location.pathname === `/#${section}` ? '' : 'opacity-70'}`}>{icon}</span>
        <span className={`text-sm font-medium ${location.pathname === `/#${section}` ? 'text-[var(--color-primary)]' : 'text-gray-600 dark:text-gray-300'}`}>
          {t(label)}
        </span>
      </RouterLink>
    </li>
  );
});
MobileDrawerLink.displayName = 'MobileDrawerLink';

// ── Main Navbar ──
const Navbar = memo(() => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLang } = useLanguage();
  const { preferences, updatePreferences } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userSidebarOpen, setUserSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const userSidebarRef = useRef(null);

  const isAuthenticated = useSelector(s => s.user?.isAuthenticated) || false;
  const unreadCount = useSelector(s => s.rescueRequests?.unreadCount || 0);

  const isRTL = currentLang === 'ar';
  const isMobile = useMediaQuery({ query: '(max-width: 1023px)' });
  const isAuthPage = AUTH_PATHS.includes(location.pathname);
  const isHomePage = location.pathname === '/';
  const currentUser = useSelector(s => s.user?.currentUser);

  // ── Active section tracking ──
  const updateActiveSection = useCallback(() => {
    if (!isHomePage || isAuthPage) {
      setActiveSection(null);
      return;
    }
    const scrollY = window.scrollY + 150;
    for (const section of NAV_SECTIONS) {
      const el = document.getElementById(section.key);
      if (!el) continue;
      const top = el.offsetTop;
      const bottom = top + el.offsetHeight;
      if (scrollY >= top && scrollY < bottom) {
        setActiveSection(section.key);
        return;
      }
    }
    setActiveSection(null);
  }, [isHomePage, isAuthPage]);

  useEffect(() => {
    if (!isHomePage || isAuthPage) {
      setActiveSection(null);
      return;
    }
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    updateActiveSection();
    return () => window.removeEventListener('scroll', updateActiveSection);
  }, [isHomePage, isAuthPage, updateActiveSection]);

  // ── Close sidebar on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (userSidebarRef.current && !userSidebarRef.current.contains(e.target)) {
        setUserSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Handlers ──
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const closeUserSidebar = useCallback(() => setUserSidebarOpen(false), []);
  const openUserSidebar = useCallback(() => setUserSidebarOpen(true), []);
  const openMobileMenu = useCallback(() => setMobileMenuOpen(true), []);

  const handleLogout = useCallback(async () => {
    await dispatch(logoutUser());
    navigate('/login');
    closeUserSidebar();
    closeMobileMenu();
  }, [dispatch, navigate, closeUserSidebar, closeMobileMenu]);

  const handleLoginNavigate = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  // ── سحب للإغلاق على الجوال ──
  useEffect(() => {
    if (!isMobile || !mobileMenuOpen) return;

    let startX = 0;
    let startY = 0;
    let isSwiping = false;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      isSwiping = false;
    };

    const handleTouchMove = (e) => {
      if (!startX) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        isSwiping = true;
        if ((isRTL && deltaX > 0) || (!isRTL && deltaX < 0)) {
          closeMobileMenu();
        }
      }
    };

    const handleTouchEnd = () => {
      startX = 0;
      startY = 0;
      isSwiping = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, mobileMenuOpen, closeMobileMenu, isRTL]);

  // ── Render User Sidebar ──
  const renderUserSidebar = useCallback(() => {
    if (!isAuthenticated || !userSidebarOpen) return null;

    return createPortal(
      <div
        className="fixed inset-0 z-[9999] flex"
        onClick={closeUserSidebar}
        aria-modal="true"
        role="dialog"
        aria-label="قائمة المستخدم"
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" />

        <div
          className={`relative w-72 max-w-[85vw] h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${isRTL ? 'right-0 translate-x-0' : 'left-0 translate-x-0'
            }`}
          onClick={e => e.stopPropagation()}
          ref={userSidebarRef}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-gray-200/70 dark:border-gray-700/70 bg-gradient-to-r from-[var(--color-primary)]/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center transition-colors duration-200">
                <FaUser className="text-[var(--color-primary)] text-xl transition-colors duration-200" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-white">
                  {currentUser?.name || t('nav.profile')}
                </p>
                <p className="text-xs text-gray-400">{t('nav.accountMenu')}</p>
              </div>
            </div>
            <button
              onClick={closeUserSidebar}
              className="p-2 rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200"
              aria-label="إغلاق القائمة"
            >
              {isRTL ? <FaChevronRight className="text-xl" /> : <FaChevronLeft className="text-xl" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4" role="menu">
            <ul className="space-y-1">
              <UserSidebarLink
                icon={<FaUserCog />}
                label={t('nav.profile', 'الملف الشخصي')}
                path="/profile"
                onClick={closeUserSidebar}
                navigate={navigate}
                closeSidebar={closeUserSidebar}
              />
              <UserSidebarLink
                icon={<FaClipboardList />}
                label={t('nav.roleRequests', 'طلبات الأدوار')}
                path="/role-requests"
                onClick={closeUserSidebar}
                navigate={navigate}
                closeSidebar={closeUserSidebar}
              />
              <UserSidebarLink
                icon={<FaShieldAlt />}
                label={t('nav.trustVerification', 'توثيق الحساب')}
                path="/trust-verification"
                onClick={closeUserSidebar}
                navigate={navigate}
                closeSidebar={closeUserSidebar}
              />

              <UserSidebarLink
                icon={<FaFlag />}
                label={t('reports.title', 'بلاغاتي')}
                path="/my-reports"
                onClick={closeUserSidebar}
                navigate={navigate}
                closeSidebar={closeUserSidebar}
              />

              {/* اختيار اللون الأساسي */}
              <li className="pt-2 pb-1">
                <div className="px-4 py-2">
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2">
                    <FaPalette className="text-[var(--color-primary)] text-xs" />
                    {t('theme.primaryColor')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(PRIMARY_COLORS).map(([key, color]) => (
                      <button
                        key={key}
                        onClick={() => updatePreferences({ primaryColor: key })}
                        className={`w-5 h-5 rounded-full transition-all duration-200 hover:scale-110 ${preferences.primaryColor === key
                          ? 'ring-2 ring-offset-1 ring-[var(--color-primary)] scale-110'
                          : ''
                          }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                        aria-label={`تغيير اللون إلى ${color.name}`}
                      />
                    ))}
                  </div>
                </div>
              </li>
            </ul>

            <div className="my-4 border-t border-gray-200/70 dark:border-gray-700/70" />

            {/* ✅ زر تسجيل الخروج - Outlined بلون الثيم */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all duration-200 font-medium active:scale-[0.98] bg-transparent"
            >
              <FaSignOutAlt /> {t('logout')}
            </button>
          </nav>
        </div>
      </div>,
      document.body
    );
  }, [
    isAuthenticated,
    userSidebarOpen,
    closeUserSidebar,
    isRTL,
    currentUser,
    t,
    navigate,
    handleLogout,
    preferences,
    updatePreferences,
  ]);

  return (
    <>
      <nav
        role="navigation"
        aria-label="القائمة الرئيسية"
        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm border-b border-gray-100/70 dark:border-gray-800/70"
      >
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <a
            href="/"
            aria-label="E-Help — الصفحة الرئيسية"
            className="text-[var(--color-primary)] font-bold text-2xl tracking-tight shrink-0 hover:scale-[1.02] transition-transform duration-200"
          >
            E‑Help
          </a>

          {/* Desktop nav links */}
          {!isMobile && (
            <div className="hidden lg:flex items-center gap-1" role="menubar">
              {NAV_SECTIONS.map(({ key, label }) => (
                <NavLink
                  key={key}
                  section={key}
                  isHomePage={isHomePage}
                  isAuthPage={isAuthPage}
                  activeSection={activeSection}
                >
                  {t(label)}
                </NavLink>
              ))}
            </div>
          )}

          {/* Right controls */}
          <div className="flex items-center gap-0.5">
            {isAuthenticated && <BellDropdown />}
            <DarkMode />
            <LanguageSwitcher />

            {!isAuthenticated && !isAuthPage && (
              <button
                onClick={handleLoginNavigate}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary)]/90 hover:shadow-lg hover:shadow-[var(--color-primary)]/25 transition-all duration-200 min-h-[44px] active:scale-[0.97]"
              >
                {t('login')}
              </button>
            )}

            {isAuthenticated && (
              <IconButton onClick={openUserSidebar} ariaLabel="قائمة المستخدم">
                <FaUserCircle className="text-2xl" />
              </IconButton>
            )}

            {isMobile && (
              <IconButton onClick={openMobileMenu} ariaLabel="فتح القائمة">
                <FaBars className="text-xl" />
              </IconButton>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      {isMobile && mobileMenuOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex"
          onClick={closeMobileMenu}
          aria-modal="true"
          role="dialog"
          aria-label="القائمة الجانبية"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div
            className={`relative w-72 max-w-[85vw] h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-2xl flex flex-col transform transition-transform duration-300 ${isRTL ? 'right-0' : 'left-0'
              }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200/70 dark:border-gray-700/70">
              <span className="text-lg font-bold text-[var(--color-primary)] transition-colors duration-200">E‑Help</span>
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200"
                aria-label="إغلاق القائمة"
              >
                {isRTL ? <FaChevronRight className="text-xl" /> : <FaChevronLeft className="text-xl" />}
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4" role="menu">
              <ul className="space-y-1">
                {NAV_SECTIONS.map(({ key, icon, label }) => (
                  <MobileDrawerLink
                    key={key}
                    section={key}
                    icon={icon}
                    label={label}
                    isHomePage={isHomePage}
                    isAuthPage={isAuthPage}
                    activeSection={activeSection}
                    closeMenu={closeMobileMenu}
                    location={location}
                    t={t}
                  />
                ))}
              </ul>

              <div className="my-4 border-t border-gray-200/70 dark:border-gray-700/70" />

              {isAuthenticated && (
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => { navigate('/profile'); closeMobileMenu(); }}
                      className="flex items-center gap-3 px-4 py-3 w-full text-right rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 group"
                    >
                      <FaUserCog className="text-[var(--color-primary)] text-lg transition-colors duration-200 group-hover:scale-110" />
                      <span className="text-sm font-medium">{t('nav.profile', 'الملف الشخصي')}</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => { navigate('/role-requests'); closeMobileMenu(); }}
                      className="flex items-center gap-3 px-4 py-3 w-full text-right rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 group"
                    >
                      <FaClipboardList className="text-[var(--color-primary)] text-lg transition-colors duration-200 group-hover:scale-110" />
                      <span className="text-sm font-medium">{t('nav.roleRequests', 'طلبات الأدوار')}</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => { navigate('/trust-verification'); closeMobileMenu(); }}
                      className="flex items-center gap-3 px-4 py-3 w-full text-right rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 group"
                    >
                      <FaShieldAlt className="text-[var(--color-primary)] text-lg transition-colors duration-200 group-hover:scale-110" />
                      <span className="text-sm font-medium">{t('nav.trustVerification', 'توثيق الحساب')}</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => { navigate('/my-reports'); closeUserSidebar(); }}
                      className="flex items-center gap-3 px-4 py-3 w-full text-right rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 group"
                    >
                      <FaFlag className="text-[var(--color-primary)] text-lg transition-colors duration-200 group-hover:scale-110" />
                      <span className="text-sm font-medium">{t('reports.title', 'بلاغاتي')}</span>
                    </button>
                  </li>
                </ul>
              )}
            </nav>

            <div className="p-4 border-t border-gray-200/70 dark:border-gray-700/70">
              {isAuthenticated ? (
                /* ✅ زر تسجيل الخروج - Outlined بلون الثيم (للموبايل) */
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all duration-200 font-medium active:scale-[0.98] bg-transparent"
                >
                  <FaSignOutAlt /> {t('logout')}
                </button>
              ) : !isAuthPage && (
                <button
                  onClick={() => { navigate('/login'); closeMobileMenu(); }}
                  className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium transition-all duration-200 hover:bg-[var(--color-primary)]/90 hover:shadow-lg hover:shadow-[var(--color-primary)]/25 active:scale-[0.98]"
                >
                  {t('login')}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── User Sidebar ── */}
      {renderUserSidebar()}
    </>
  );
});

Navbar.displayName = 'Navbar';
export default Navbar;