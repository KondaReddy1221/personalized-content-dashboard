import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { FavoriteItem } from '@/types/content';

interface FavoritesState {
  items: FavoriteItem[];
}

const getStorageKey = () => {
  if (typeof window === 'undefined') return 'content-dashboard-favorites-guest';

  const raw = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('personalized_dashboard_user='));

  if (!raw) {
    return 'content-dashboard-favorites-guest';
  }

  try {
    const user = JSON.parse(decodeURIComponent(raw.split('=')[1] ?? '{}')) as { id?: string };
    return `content-dashboard-favorites-${user.id ?? 'guest'}`;
  } catch {
    return 'content-dashboard-favorites-guest';
  }
};

const readFavorites = (): FavoriteItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(getStorageKey());
    return raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
  } catch {
    return [];
  }
};

const initialState: FavoritesState = {
  items: [],
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    addFavorite: (state, action: PayloadAction<FavoriteItem>) => {
      const exists = state.items.some((item) => item.id === action.payload.id && item.type === action.payload.type);
      if (!exists) {
        state.items.push(action.payload);
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(getStorageKey(), JSON.stringify(state.items));
      }
    },
    removeFavorite: (state, action: PayloadAction<{ id: string; type: FavoriteItem['type'] }>) => {
      state.items = state.items.filter(
        (item) => !(item.id === action.payload.id && item.type === action.payload.type),
      );
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(getStorageKey(), JSON.stringify(state.items));
      }
    },
    toggleFavorite: (state, action: PayloadAction<FavoriteItem>) => {
      const existing = state.items.some(
        (item) => item.id === action.payload.id && item.type === action.payload.type,
      );

      if (existing) {
        state.items = state.items.filter(
          (item) => !(item.id === action.payload.id && item.type === action.payload.type),
        );
      } else {
        state.items.push(action.payload);
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(getStorageKey(), JSON.stringify(state.items));
      }
    },
    hydrateFavorites: (state) => {
      state.items = readFavorites();
    },
  },
});

export const { addFavorite, removeFavorite, toggleFavorite, hydrateFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
