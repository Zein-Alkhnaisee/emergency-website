import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'theme_preferences';
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';

// الألوان الأساسية المتاحة مع قيم RGB
const PRIMARY_COLORS = {
  red: { name: 'أحمر', value: '#ef4444', dark: '#dc2626', rgb: '239, 68, 68' },
  blue: { name: 'أزرق', value: '#3b82f6', dark: '#2563eb', rgb: '59, 130, 246' },
  purple: { name: 'بنفسجي', value: '#8b5cf6', dark: '#7c3aed', rgb: '139, 92, 246' },
  green: { name: 'أخضر', value: '#22c55e', dark: '#16a34a', rgb: '34, 197, 94' },
  orange: { name: 'برتقالي', value: '#f97316', dark: '#ea580c', rgb: '249, 115, 22' },
  rose: { name: 'وردي', value: '#f43f5e', dark: '#e11d48', rgb: '244, 63, 94' },
};

const DEFAULT_THEME = {
  mode: 'system', // 'light' | 'dark' | 'system'
  primaryColor: 'red',
};

const loadThemePreferences = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_THEME, ...parsed };
    }
  } catch {}
  return DEFAULT_THEME;
};

export const ThemeProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(loadThemePreferences);
  const [systemIsDark, setSystemIsDark] = useState(
    window.matchMedia?.(SYSTEM_THEME_QUERY)?.matches ?? false
  );

  // مراقبة تغييرات النظام
  useEffect(() => {
    const media = window.matchMedia(SYSTEM_THEME_QUERY);
    const handler = (e) => setSystemIsDark(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  // تطبيق الثيم على الـ DOM
  useEffect(() => {
    const root = document.documentElement;
    const { mode, primaryColor } = preferences;

    // 1. تطبيق الوضع (dark/light)
    const actualMode = mode === 'system' 
      ? (systemIsDark ? 'dark' : 'light')
      : mode;

    if (actualMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 2. تطبيق اللون الأساسي
    const color = PRIMARY_COLORS[primaryColor] || PRIMARY_COLORS.red;
    root.style.setProperty('--color-primary', color.value);
    root.style.setProperty('--color-primary-dark', color.dark);
    root.style.setProperty('--color-primary-rgb', color.rgb);

    // 3. ✅ تحديث لون شريط المتصفح (theme-color) للموبايل
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = color.value;
    }

    // حفظ التفضيلات
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences, systemIsDark]);

  const updatePreferences = useCallback((newPrefs) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  }, []);

  const value = {
    preferences,
    updatePreferences,
    systemIsDark,
    actualMode: preferences.mode === 'system'
      ? (systemIsDark ? 'dark' : 'light')
      : preferences.mode,
    primaryColor: PRIMARY_COLORS[preferences.primaryColor] || PRIMARY_COLORS.red,
    PRIMARY_COLORS,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { PRIMARY_COLORS };