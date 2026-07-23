"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  preference: "system",
  toggle: () => {},
  setPreference: () => {},
});

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(preference) {
  if (preference === "dark") return "dark";
  if (preference === "light") return "light";
  return systemPrefersDark() ? "dark" : "light"; // "system"
}

export function ThemeProvider({ children }) {
  // `preference` is what the user picked; `theme` is what's actually applied.
  const [preference, setPreferenceState] = useState("system");
  const [theme, setTheme] = useState("light");

  // Initialise from the stored preference (the pre-paint script already set the class).
  useEffect(() => {
    let stored = "system";
    try {
      stored = localStorage.getItem("clipse-theme") || "system";
    } catch {}
    setPreferenceState(stored);
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  // While following the OS, react to system theme changes live.
  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = mq.matches ? "dark" : "light";
      setTheme(next);
      document.documentElement.classList.toggle("dark", next === "dark");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = (next) => {
    setPreferenceState(next);
    const resolved = resolve(next);
    setTheme(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    try {
      localStorage.setItem("clipse-theme", next);
    } catch {}
  };

  // Toggle picks an explicit light/dark (leaves "system" behind by design).
  const toggle = () => setPreference(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, preference, toggle, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
