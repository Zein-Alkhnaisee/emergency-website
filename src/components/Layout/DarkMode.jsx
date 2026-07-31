import { useCallback, memo } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useState, useEffect } from 'react';

const getInitialTheme = () => {
  try {
    return localStorage.getItem('theme') || 'light';
  } catch {
    return 'light';
  }
};

const DarkMode = memo(() => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
      aria-label={theme === 'dark' ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
    >
      {theme === 'dark'
        ? <FaSun className="text-yellow-400 text-xl" />
        : <FaMoon className="text-gray-600 text-xl" />
      }
    </button>
  );
});

DarkMode.displayName = 'DarkMode';
export default DarkMode;