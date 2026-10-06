import { act, renderHook } from '@testing-library/react';
import { addCategory, removeCategory, resetPreferences } from '@/features/preferences/preferencesSlice';
import preferencesReducer from '@/features/preferences/preferencesSlice';
import favoritesReducer, { toggleFavorite } from '@/features/favorites/favoritesSlice';
import themeReducer, { toggleTheme } from '@/features/theme/themeSlice';
import { useDebounce } from '@/hooks/useDebounce';
import { searchContent } from '@/utils/search';
import { defaultPreferences, mockNews, mockMovies, mockSocialPosts } from '@/data/mockData';

describe('preferences reducer', () => {
  it('adds and removes selected categories', () => {
    const initial = preferencesReducer(undefined, { type: 'preferences/hydratePreferences' });
    const next = preferencesReducer(initial, addCategory('Finance'));
    expect(next.selectedCategories).toContain('Finance');

    const removed = preferencesReducer(next, removeCategory('Finance'));
    expect(removed.selectedCategories).not.toContain('Finance');
  });

  it('resets to the default preferences', () => {
    const state = preferencesReducer({ selectedCategories: ['Technology', 'Sports'] }, resetPreferences());
    expect(state.selectedCategories).toEqual(defaultPreferences);
  });
});

describe('favorites reducer', () => {
  beforeEach(() => {
    document.cookie = 'personalized_dashboard_user=' + encodeURIComponent(JSON.stringify({ id: 'user-123' }));
  });

  it('toggles a favorite item and persists it to localStorage', () => {
    const item = { id: mockNews[0].id, type: 'news' as const, title: mockNews[0].title, image: mockNews[0].image };
    const next = favoritesReducer({ items: [] }, toggleFavorite(item));
    expect(next.items).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('content-dashboard-favorites-user-123') || '[]')).toHaveLength(1);
  });
});

describe('theme reducer', () => {
  it('toggles between light and dark modes', () => {
    const light = themeReducer(undefined, { type: 'theme/hydrateTheme' });
    const dark = themeReducer(light, toggleTheme());
    expect(dark.mode).toBe('dark');
  });
});

describe('debounce hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('updates only after the delay completes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 400), {
      initialProps: { value: 'A' },
    });

    expect(result.current).toBe('A');
    rerender({ value: 'AI' });
    expect(result.current).toBe('A');

    act(() => {
      jest.advanceTimersByTime(399);
    });
    expect(result.current).toBe('A');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('AI');
  });
});

describe('search logic', () => {
  it('finds matches across content types', () => {
    const content = [...mockNews, ...mockMovies, ...mockSocialPosts];
    const results = searchContent(content, 'AI');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((item) => item.type === 'news')).toBeTruthy();
  });

  it('returns an empty array for empty search input', () => {
    expect(searchContent(mockNews, '   ')).toEqual([]);
  });
});
