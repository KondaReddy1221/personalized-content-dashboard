import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
}

const getStorageKey = () => {
  if (typeof window === 'undefined') return 'content-dashboard-theme-guest';

  const raw = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('personalized_dashboard_user='));

  if (!raw) {
    return 'content-dashboard-theme-guest';
  }

  try {
    const user = JSON.parse(decodeURIComponent(raw.split('=')[1] ?? '{}')) as { id?: string };
    return `content-dashboard-theme-${user.id ?? 'guest'}`;
  } catch {
    return 'content-dashboard-theme-guest';
  }
};

const savedTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(getStorageKey());
  return stored === 'dark' ? 'dark' : 'light';
};

const initialState: ThemeState = {
  mode: 'light',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(getStorageKey(), action.payload);
      }
    },
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(getStorageKey(), state.mode);
      }
    },
    hydrateTheme: (state) => {
      state.mode = savedTheme();
    },
  },
});

export const { setTheme, toggleTheme, hydrateTheme } = themeSlice.actions;
export default themeSlice.reducer;
