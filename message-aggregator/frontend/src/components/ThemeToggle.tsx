import React from "react";
import { useTheme } from "../contexts/ThemeContext";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 rounded-lg flex items-center justify-center
                 bg-slate-200 dark:bg-slate-700
                 hover:bg-slate-300 dark:hover:bg-slate-600
                 transition-all duration-200 text-base"
      aria-label="Toggle theme"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
};

export default ThemeToggle;
