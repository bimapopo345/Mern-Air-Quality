import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [accentColor, setAccentColor] = useState('#64ffda'); // Vibrant cyan

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedAccentColor = localStorage.getItem('accentColor');
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
    
    if (savedAccentColor) {
      setAccentColor(savedAccentColor);
    }
  }, []);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }

    // Update CSS custom properties
    root.style.setProperty('--accent-color', accentColor);
    
    // Save to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('accentColor', accentColor);
  }, [isDarkMode, accentColor]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const changeAccentColor = (color) => {
    setAccentColor(color);
  };

  // Predefined color schemes
  const colorSchemes = {
    cyan: '#64ffda',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    pink: '#ec4899',
    green: '#10b981',
    orange: '#f59e0b'
  };

  const value = {
    isDarkMode,
    accentColor,
    toggleTheme,
    changeAccentColor,
    colorSchemes
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};