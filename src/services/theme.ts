import { useState, useEffect } from 'react';

export type Theme = 'doodle' | 'cyber' | 'cozy';

const THEME_KEY = 'app_theme';

export const getTheme = (): Theme => {
  return (localStorage.getItem(THEME_KEY) as Theme) || 'doodle';
};

export const setTheme = (theme: Theme) => {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute('data-theme', theme);
  window.dispatchEvent(new Event('theme-change'));
};

export const useTheme = () => {
  const [theme, setCurrentTheme] = useState<Theme>(getTheme());

  useEffect(() => {
    const handleThemeChange = () => {
      setCurrentTheme(getTheme());
    };

    // Set initial attribute
    document.documentElement.setAttribute('data-theme', getTheme());

    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  return { theme, setTheme };
};
