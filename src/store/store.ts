import { configureStore } from '@reduxjs/toolkit';
import themeReducer from '@/features/theme/themeSlice';
import preferencesReducer from '@/features/preferences/preferencesSlice';
import favoritesReducer from '@/features/favorites/favoritesSlice';
import feedReducer from '@/features/feed/feedSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    preferences: preferencesReducer,
    favorites: favoritesReducer,
    feed: feedReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
