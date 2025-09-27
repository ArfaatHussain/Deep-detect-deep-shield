
import React, { createContext, useState } from 'react';
import { Appearance } from 'react-native';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkTheme, setDarkTheme] = useState(
    Appearance.getColorScheme() === 'dark' // auto-detect system theme
  );

  const toggleTheme = () => {
    setDarkTheme((prev) => !prev);
    
  };

  return (
    <ThemeContext.Provider value={{ darkTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
