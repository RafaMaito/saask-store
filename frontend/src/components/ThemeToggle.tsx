import React from 'react';
import { useThemeStore } from '../store/themeStore.js';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-2 text-xs font-medium backdrop-blur-sm ${className}`}
      title={isDark ? 'Alternar para Modo Claro (Light Mode)' : 'Alternar para Modo Escuro (Dark Mode)'}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span>Modo Claro</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-purple-600" />
          <span>Modo Escuro</span>
        </>
      )}
    </button>
  );
};
