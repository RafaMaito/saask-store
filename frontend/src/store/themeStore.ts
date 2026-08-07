import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const savedTheme = localStorage.getItem('saas_ai_theme');
  const initialDark = savedTheme !== 'light';

  // Sincroniza a classe 'dark' no elemento HTML (Syncs dark class on HTML root element)
  if (initialDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  return {
    isDark: initialDark,
    toggleTheme: () =>
      set((state) => {
        const nextDark = !state.isDark;
        localStorage.setItem('saas_ai_theme', nextDark ? 'dark' : 'light');
        if (nextDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { isDark: nextDark };
      }),
  };
});
