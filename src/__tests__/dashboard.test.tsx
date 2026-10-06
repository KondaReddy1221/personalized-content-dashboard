import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import DashboardApp from '@/components/dashboard/DashboardApp';
import themeReducer from '@/features/theme/themeSlice';
import preferencesReducer from '@/features/preferences/preferencesSlice';
import favoritesReducer from '@/features/favorites/favoritesSlice';
import feedReducer from '@/features/feed/feedSlice';
import { mockNews } from '@/data/mockData';

const rootReducer = combineReducers({
  theme: themeReducer,
  preferences: preferencesReducer,
  favorites: favoritesReducer,
  feed: feedReducer,
});

type TestState = ReturnType<typeof rootReducer>;

function createTestStore() {
  const preloadedState: Partial<TestState> = {
    theme: { mode: 'light' },
    preferences: { selectedCategories: ['Technology', 'Business', 'Health', 'Entertainment'] },
    favorites: { items: [] },
    feed: {
      items: mockNews.slice(0, 3).map((item) => ({ ...item })),
      status: 'success',
      error: null,
    },
  };

  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
}

describe('Dashboard integration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'personalized_dashboard_user=' + encodeURIComponent(JSON.stringify({ id: 'user-123' }));
  });

  it('renders the dashboard and shows overview content', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <DashboardApp />
      </Provider>,
    );

    await waitFor(() => expect(screen.getByText(/personalized overview/i)).toBeInTheDocument());
  });

  it('searches for matching content and updates the results list', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <DashboardApp />
      </Provider>,
    );

    const input = screen.getByLabelText(/search content/i);
    fireEvent.change(input, { target: { value: 'AI' } });

    await waitFor(() => expect(screen.getByText(/search results/i)).toBeInTheDocument());
  });

  it('adds an item to favorites and persists it in localStorage', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <DashboardApp />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /personalized feed/i }));

    const favoriteButton = await screen.findByLabelText(/favorite ai copilots reshape enterprise productivity in 2026/i);
    fireEvent.click(favoriteButton);

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('content-dashboard-favorites-user-123') || '[]');
      expect(stored.length).toBeGreaterThan(0);
    });
  });
});
