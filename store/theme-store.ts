import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = '@theme_mode';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = useCallback(async () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }, [theme]);

  const setLightTheme = useCallback(async () => {
    setTheme('light');
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, 'light');
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }, []);

  const setDarkTheme = useCallback(async () => {
    setTheme('dark');
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }, []);

  return useMemo(() => ({
    theme,
    isDark: theme === 'dark',
    isLoading,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
  }), [theme, isLoading, toggleTheme, setLightTheme, setDarkTheme]);
});
