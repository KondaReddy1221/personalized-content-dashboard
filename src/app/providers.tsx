'use client';

import { Provider, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { store, type AppDispatch } from '@/store/store';
import { hydrateTheme } from '@/features/theme/themeSlice';
import { hydratePreferences } from '@/features/preferences/preferencesSlice';
import { hydrateFavorites } from '@/features/favorites/favoritesSlice';
import { fetchFeed, hydrateFeedOrder } from '@/features/feed/feedSlice';

function StoreHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(hydrateTheme());
    dispatch(hydratePreferences());
    dispatch(hydrateFavorites());
    dispatch(hydrateFeedOrder());
    dispatch(fetchFeed());
  }, [dispatch]);

  return children;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <StoreHydrator>{children}</StoreHydrator>
    </Provider>
  );
}
