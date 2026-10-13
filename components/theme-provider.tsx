"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  storageKey?: string;
  disableTransitionOnChange?: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
);

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeClass(theme: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

/**
 * Applies the resolved theme, optionally suppressing CSS transitions so the
 * swap does not animate (e.g. background-color easing on theme toggle).
 */
function applyThemeWithTransitionGuard(
  theme: ResolvedTheme,
  disableTransition: boolean,
): void {
  if (!disableTransition) {
    applyThemeClass(theme);
    return;
  }

  const style = document.createElement("style");
  style.appendChild(document.createTextNode("*{transition:none!important}"));
  document.head.appendChild(style);

  applyThemeClass(theme);

  // Force a reflow so the browser commits the new styles before transitions
  // are re-enabled on the next tick.
  void document.body.offsetHeight;
  window.setTimeout(() => style.remove(), 0);
}

function isTheme(value: string | undefined | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

const ThemeHotkeyListener = (): React.JSX.Element | null => {
  const { resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Requires Ctrl+Shift+D or Cmd+Shift+D to toggle theme (preventing accidental single 'd' keystroke)
      if (
        e.key.toLowerCase() === "d" &&
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey
      ) {
        e.preventDefault();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resolvedTheme, setTheme]);

  return null;
};

export const ThemeProvider = ({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  storageKey = "theme",
  disableTransitionOnChange = false,
}: ThemeProviderProps): React.JSX.Element => {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }

    const savedTheme = localStorage.getItem(storageKey);
    return isTheme(savedTheme) ? savedTheme : defaultTheme;
  });
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return getSystemTheme();
  });
  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (enableSystem ? systemTheme : "light") : theme;

  React.useEffect(() => {
    if (attribute === "class") {
      applyThemeWithTransitionGuard(resolvedTheme, disableTransitionOnChange);
    }
    localStorage.setItem(storageKey, theme);
  }, [attribute, disableTransitionOnChange, resolvedTheme, storageKey, theme]);

  React.useEffect(() => {
    if (!enableSystem || theme !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (): void => {
      const nextResolvedTheme = getSystemTheme();
      setSystemTheme(nextResolvedTheme);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [enableSystem, theme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: setThemeState,
    }),
    [resolvedTheme, theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ThemeHotkeyListener />
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
