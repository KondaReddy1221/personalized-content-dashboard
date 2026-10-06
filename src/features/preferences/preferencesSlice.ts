import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { categories, defaultPreferences } from '@/data/mockData';
import type { Category } from '@/types/content';

interface PreferencesState {
  selectedCategories: Category[];
}

const getStorageKey = () => {
  if (typeof window === 'undefined') return 'content-dashboard-preferences-guest';

  const raw = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('personalized_dashboard_user='));

  if (!raw) {
    return 'content-dashboard-preferences-guest';
  }

  try {
    const user = JSON.parse(decodeURIComponent(raw.split('=')[1] ?? '{}')) as { id?: string };
    return `content-dashboard-preferences-${user.id ?? 'guest'}`;
  } catch {
    return 'content-dashboard-preferences-guest';
  }
};

const readPreferences = (): Category[] => {
  if (typeof window === 'undefined') return defaultPreferences;

  const raw = window.localStorage.getItem(getStorageKey());
  if (!raw) return defaultPreferences;

  try {
    const parsed = JSON.parse(raw) as Category[];
    return parsed.filter((category): category is Category => categories.includes(category));
  } catch {
    return defaultPreferences;
  }
};

const initialState: PreferencesState = {
  selectedCategories: defaultPreferences,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    addCategory: (state, action: PayloadAction<Category>) => {
      const category = action.payload;
      if (!state.selectedCategories.includes(category)) {
        state.selectedCategories.push(category);
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(getStorageKey(), JSON.stringify(state.selectedCategories));
      }
    },
    removeCategory: (state, action: PayloadAction<Category>) => {
      state.selectedCategories = state.selectedCategories.filter((category) => category !== action.payload);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(getStorageKey(), JSON.stringify(state.selectedCategories));
      }
    },
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.selectedCategories = action.payload;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(getStorageKey(), JSON.stringify(state.selectedCategories));
      }
    },
    resetPreferences: (state) => {
      state.selectedCategories = defaultPreferences;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(getStorageKey(), JSON.stringify(state.selectedCategories));
      }
    },
    hydratePreferences: (state) => {
      state.selectedCategories = readPreferences();
    },
  },
});

export const { addCategory, removeCategory, setCategories, resetPreferences, hydratePreferences } =
  preferencesSlice.actions;
export default preferencesSlice.reducer;
