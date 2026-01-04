
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Fix: Import shared Theme type from types.ts
import { Theme } from '../types.ts';

type Direction = 'ltr' | 'rtl';
type FontSize = 'sm' | 'base' | 'lg';

interface ThemeContextType {
  theme: Theme;
  direction: Direction;
  fontSize: FontSize;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setDirection: (dir: Direction) => void;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('craftly_theme') as Theme) || 'system');
  const [direction, setDirection] = useState<Direction>(() => (localStorage.getItem('craftly_direction') as Direction) || 'ltr');
  const [fontSize, setFontSizeState] = useState<FontSize>(() => (localStorage.getItem('craftly_fontsize') as FontSize) || 'base');

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = () => {
      root.classList.remove('light', 'dark');
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    };

    applyTheme();

    // Listen for system changes if in system mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }

    localStorage.setItem('craftly_theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('dir', direction);
    
    const fontSizes = { 
      sm: '12px',
      base: '14px',
      lg: '16px'
    };
    root.style.fontSize = fontSizes[fontSize];

    localStorage.setItem('craftly_direction', direction);
    localStorage.setItem('craftly_fontsize', fontSize);
  }, [direction, fontSize]);

  const toggleTheme = () => {
    setThemeState(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const setTheme = (t: Theme) => setThemeState(t);
  const setFontSize = (size: FontSize) => setFontSizeState(size);

  return (
    <ThemeContext.Provider value={{ theme, direction, fontSize, toggleTheme, setTheme, setDirection, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
