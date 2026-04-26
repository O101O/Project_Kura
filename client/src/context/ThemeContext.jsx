/**
 * Theme context - Manages dark/light theme state and persistence.
 * Applies theme classes to the document and provides toggle functionality.
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem(STORAGE_KEYS.theme) || 'light');

  // Apply theme to document and persist to localStorage
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};
