import React, { useState, useEffect, ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext, themes, ThemeName, Theme } from "./index";

const THEME_STORAGE_KEY = "@tourandot/theme";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeName, setThemeName] = useState<ThemeName>(defaultTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved && saved in themes) {
        setThemeName(saved as ThemeName);
      }
      setIsLoaded(true);
    });
  }, []);

  const setTheme = (name: ThemeName) => {
    setThemeName(name);
    AsyncStorage.setItem(THEME_STORAGE_KEY, name);
  };

  const theme: Theme = themes[themeName];

  // Don't render until theme is loaded to avoid flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
