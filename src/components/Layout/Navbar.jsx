// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-scroll';
// import { useTranslation } from 'react-i18next';
// import { FaBars, FaCaretDown, FaShoppingCart, FaTimes } from 'react-icons/fa';
// import { IoMdSearch } from 'react-icons/io';
// import DarkMode from './DarkMode';
// import LanguageSwitcher from './LanguageSwitcher';

// const Navbar = () => {
//     const { t } = useTranslation();
//     const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//     const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
//     const [activeSection, setActiveSection] = useState('home');

//     const sections = ['home', 'emergency', 'posts', 'courses', 'services', 'marketplace'];

//     // Scroll spy باستخدام Intersection Observer
//     useEffect(() => {
//         const observers = sections.map(sectionId => {
//             const element = document.getElementById(sectionId);
//             if (!element) return null;
//             const observer = new IntersectionObserver(
//                 ([entry]) => {
//                     if (entry.isIntersecting) setActiveSection(sectionId);
//                 },
//                 { threshold: 0.5 }
//             );
//             observer.observe(element);
//             return observer;
//         });
//         return () => observers.forEach(obs => obs?.disconnect());
//     }, []);

//     return (
//         <nav className="bg-white dark:bg-gray-900 sticky top-0 z-50 shadow-sm">
//             <div className="container mx-auto px-4 py-3 flex justify-between items-center">
//                 {/* Logo */}
//                 <a href="/" className="text-primary font-bold text-2xl">E‑Help</a>

//                 {/* Desktop Menu */}
//                 <div className="hidden xl:flex items-center space-x-4">
//                     {sections.map(section => (
//                         <Link
//                             key={section}
//                             to={section}
//                             spy={true}
//                             smooth={true}
//                             duration={500}
//                             className={`nav-link ${activeSection === section ? 'active' : ''}`}
//                         >
//                             {t(`nav.${section}`)}
//                         </Link>
//                     ))}
//                 </div>

//                 {/* Right Icons */}
//                 <div className="flex items-center gap-2">
//                     <div className="relative hidden md:block">
//                         <IoMdSearch className="text-2xl cursor-pointer" onClick={() => setIsDesktopSearchOpen(!isDesktopSearchOpen)} />
//                         {isDesktopSearchOpen && (
//                             <input type="text" placeholder="Search..." className="absolute right-0 top-10 w-64 p-2 rounded-full border" />
//                         )}
//                     </div>
//                     <FaShoppingCart className="text-2xl cursor-pointer" />
//                     <DarkMode />
//                     <LanguageSwitcher />
//                     <button className="xl:hidden p-2" onClick={() => setMobileMenuOpen(true)}>
//                         <FaBars className="text-2xl" />
//                     </button>
//                 </div>
//             </div>

//             {/* Mobile Sidebar */}
//             {mobileMenuOpen && (
//                 <div className="fixed inset-0 bg-black/50 z-50 xl:hidden">
//                     <div className="bg-white dark:bg-gray-900 w-80 h-full p-5">
//                         <button onClick={() => setMobileMenuOpen(false)} className="mb-4"><FaTimes /></button>
//                         {sections.map(section => (
//                             <Link key={section} to={section} smooth={true} onClick={() => setMobileMenuOpen(false)} className="block py-2">
//                                 {t(`nav.${section}`)}
//                             </Link>
//                         ))}
//                     </div>
//                 </div>
//             )}
//         </nav>
//     );
// };

// export default Navbar;
import  { useState, useEffect } from 'react';
import { Link } from 'react-scroll';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { FaBars, FaShoppingCart, FaTimes } from 'react-icons/fa';
import { IoMdSearch } from 'react-icons/io';
import DarkMode from './DarkMode';
import LanguageSwitcher from './LanguageSwitcher';
import { openCart } from '../../redux/slices/marketplaceSlice';

const Navbar = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { userCart } = useSelector(state => state.marketplace);

  const sections = ['home', 'emergency', 'posts', 'courses', 'marketplace'];

  // Scroll spy
  useEffect(() => {
    const observers = sections.map(sectionId => {
      const element = document.getElementById(sectionId);
      if (!element) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(sectionId);
        },
        { threshold: 0.4 }
      );
      observer.observe(element);
      return observer;
    });
    return () => observers.forEach(obs => obs?.disconnect());
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-900 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="home" smooth={true} duration={500} className="text-primary font-bold text-2xl cursor-pointer">
          E‑Help
        </Link>

        {/* Desktop Menu */}
        <div className="hidden xl:flex items-center space-x-4">
          {sections.map(section => (
            <Link
              key={section}
              to={section}
              spy={true}
              smooth={true}
              duration={500}
              offset={-70}
              className={`nav-link ${activeSection === section ? 'active' : ''}`}
            >
              {t(`nav.${section}`)}
            </Link>
          ))}
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <IoMdSearch className="text-2xl cursor-pointer" onClick={() => setSearchOpen(!searchOpen)} />
            {searchOpen && (
              <input
                type="text"
                placeholder={t('common.search') || 'Search...'}
                className="absolute right-0 top-10 w-64 p-2 rounded-full border dark:bg-gray-800"
              />
            )}
          </div>

          {/* أيقونة السلة - تظهر دائماً */}
          <button
            onClick={() => dispatch(openCart())}
            className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <FaShoppingCart className="text-2xl text-gray-700 dark:text-gray-300" />
            {userCart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {userCart.length}
              </span>
            )}
          </button>

          <DarkMode />
          <LanguageSwitcher />
          <button className="xl:hidden p-2" onClick={() => setMobileMenuOpen(true)}>
            <FaBars className="text-2xl" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 xl:hidden">
          <div className="bg-white dark:bg-gray-900 w-80 h-full p-5">
            <button onClick={() => setMobileMenuOpen(false)} className="mb-4"><FaTimes /></button>
            {sections.map(section => (
              <Link
                key={section}
                to={section}
                smooth={true}
                duration={500}
                offset={-70}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2"
              >
                {t(`nav.${section}`)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;