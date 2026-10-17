import { memo, useCallback } from 'react';
import { FaSun, FaMoon, FaDesktop } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';

const DarkMode = memo(() => {
  const { preferences, updatePreferences, actualMode } = useTheme();
  const isDark = actualMode === 'dark';

  const toggle = useCallback(() => {
    const modes = ['system', 'light', 'dark'];
    const currentIndex = modes.indexOf(preferences.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    updatePreferences({ mode: modes[nextIndex] });
  }, [preferences.mode, updatePreferences]);

  const getIcon = useCallback(() => {
    if (preferences.mode === 'system') {
      return <FaDesktop className="text-xl" />;
    }
    return isDark 
      ? <FaMoon className="text-xl text-yellow-400" />
      : <FaSun className="text-xl text-yellow-500" />;
  }, [preferences.mode, isDark]);

  const getLabel = useCallback(() => {
    if (preferences.mode === 'system') return 'تلقائي';
    return isDark ? 'ليلي' : 'نهاري';
  }, [preferences.mode, isDark]);

  return (
    <button
      onClick={toggle}
      className="relative p-2 rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 group"
      aria-label={`تبديل الثيم (حالياً: ${getLabel()})`}
      title={`الوضع: ${getLabel()}`}
    >
      <span className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
        {getIcon()}
      </span>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-medium text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        {getLabel()}
      </span>
    </button>
  );
});

DarkMode.displayName = 'DarkMode';
export default DarkMode;