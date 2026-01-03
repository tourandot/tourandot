import { createContext, useContext } from "react";

export interface Theme {
  colors: {
    // Backgrounds
    background: string;
    surface: string;
    surfaceHover: string;

    // Text
    text: string;
    textMuted: string;
    textInverse: string;

    // Primary
    primary: string;
    primaryMuted: string;

    // Accents
    success: string;
    successMuted: string;
    error: string;
    errorMuted: string;
    warning: string;

    // Borders
    border: string;
    borderMuted: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  typography: {
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    weights: {
      normal: "400";
      medium: "500";
      semibold: "600";
      bold: "700";
    };
  };
}

// Dark theme (current)
export const darkTheme: Theme = {
  colors: {
    background: "#0f0f1a",
    surface: "#1a1a2e",
    surfaceHover: "#2a2a3e",

    text: "#ffffff",
    textMuted: "#a0a0a0",
    textInverse: "#000000",

    primary: "#6366f1",
    primaryMuted: "rgba(99, 102, 241, 0.2)",

    success: "#22c55e",
    successMuted: "rgba(34, 197, 94, 0.2)",
    error: "#ef4444",
    errorMuted: "rgba(239, 68, 68, 0.2)",
    warning: "#f59e0b",

    border: "#2a2a3e",
    borderMuted: "#1a1a2e",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
  typography: {
    sizes: {
      xs: 11,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 24,
    },
    weights: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },
};

// Light theme (alternative)
export const lightTheme: Theme = {
  ...darkTheme,
  colors: {
    background: "#f5f5f7",
    surface: "#ffffff",
    surfaceHover: "#f0f0f2",

    text: "#1a1a1a",
    textMuted: "#666666",
    textInverse: "#ffffff",

    primary: "#6366f1",
    primaryMuted: "rgba(99, 102, 241, 0.1)",

    success: "#22c55e",
    successMuted: "rgba(34, 197, 94, 0.1)",
    error: "#ef4444",
    errorMuted: "rgba(239, 68, 68, 0.1)",
    warning: "#f59e0b",

    border: "#e5e5e5",
    borderMuted: "#f0f0f0",
  },
};

// Warm dark theme (alternative)
export const warmDarkTheme: Theme = {
  ...darkTheme,
  colors: {
    background: "#1a1512",
    surface: "#2a2320",
    surfaceHover: "#3a332f",

    text: "#f5f0eb",
    textMuted: "#a89f97",
    textInverse: "#1a1512",

    primary: "#e07a5f",
    primaryMuted: "rgba(224, 122, 95, 0.2)",

    success: "#81b29a",
    successMuted: "rgba(129, 178, 154, 0.2)",
    error: "#e63946",
    errorMuted: "rgba(230, 57, 70, 0.2)",
    warning: "#f2cc8f",

    border: "#3a332f",
    borderMuted: "#2a2320",
  },
};

export const themes = {
  dark: darkTheme,
  light: lightTheme,
  warmDark: warmDarkTheme,
} as const;

export type ThemeName = keyof typeof themes;

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  themeName: "dark",
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);
