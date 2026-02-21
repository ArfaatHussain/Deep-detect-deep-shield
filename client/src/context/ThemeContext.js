import React, { createContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkTheme, setDarkTheme] = useState(false);
  const [loading, setLoading] = useState(true); // optional: for initial load

  // Load theme from AsyncStorage or system preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme');
        if (storedTheme) {
          setDarkTheme(storedTheme === 'dark');
        } else {
          // Fallback to system theme
          setDarkTheme(Appearance.getColorScheme() === 'dark');
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Toggle theme and save to AsyncStorage
  const toggleTheme = async () => {
    try {
      setDarkTheme((prev) => {
        const newTheme = !prev;
        AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
        return newTheme;
      });
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ darkTheme, toggleTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};
