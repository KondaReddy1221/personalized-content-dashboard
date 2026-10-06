import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchDashboardContent } from '@/services/contentService';
import type { RootState } from '@/store/store';
import type { Category, FeedItem } from '@/types/content';

export interface FeedState {
  items: FeedItem[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}

const getStorageKey = () => {
  if (typeof window === 'undefined') return 'content-dashboard-feed-order-guest';

  const raw = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('personalized_dashboard_user='));

  if (!raw) {
    return 'content-dashboard-feed-order-guest';
  }

  try {
    const user = JSON.parse(decodeURIComponent(raw.split('=')[1] ?? '{}')) as { id?: string };
    return `content-dashboard-feed-order-${user.id ?? 'guest'}`;
  } catch {
    return 'content-dashboard-feed-order-guest';
  }
};

const readSavedFeed = (): FeedItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const value = window.localStorage.getItem(getStorageKey());
    return value ? (JSON.parse(value) as FeedItem[]) : [];
  } catch {
    return [];
  }
};

const applySavedOrder = (items: FeedItem[]): FeedItem[] => {
  const saved = readSavedFeed();
  if (!saved.length) return items;

  const savedMap = new Map(saved.map((item) => [item.id, item]));
  const ordered = items.map((item) => savedMap.get(item.id) ?? item);

  const savedOrder = saved
    .map((item) => item.id)
    .filter((id) => ordered.some((next) => next.id === id));

  const remaining = ordered.filter((item) => !savedOrder.includes(item.id));
  return [...savedOrder.map((id) => ordered.find((item) => item.id === id)!).filter(Boolean), ...remaining];
};

const initialState: FeedState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchFeed = createAsyncThunk<FeedItem[], Category[] | void, { rejectValue: string }>(
  'feed/fetchFeed',
  async (selectedCategories, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as RootState;
      const categories = selectedCategories ?? state.preferences.selectedCategories;
      const response = await fetchDashboardContent(categories);
      return applySavedOrder(response);
    } catch {
      return thunkAPI.rejectWithValue('Unable to load personalized feed. Please try again.');
    }
  },
);

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setFeed: (state, action: PayloadAction<FeedItem[]>) => {
      state.items = action.payload;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(getStorageKey(), JSON.stringify(action.payload));
      }
    },
    hydrateFeedOrder: (state) => {
      state.items = readSavedFeed();
    },
    reorderFeed: (state, action: PayloadAction<{ activeId: string; overId: string }>) => {
      const { activeId, overId } = action.payload;
      if (activeId === overId) return;
      const oldIndex = state.items.findIndex((item) => item.id === activeId);
      const newIndex = state.items.findIndex((item) => item.id === overId);
      if (oldIndex < 0 || newIndex < 0) return;
      const [movedItem] = state.items.splice(oldIndex, 1);
      state.items.splice(newIndex, 0, movedItem);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(getStorageKey(), JSON.stringify(state.items));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.status = 'success';
        state.items = action.payload;
        state.error = null;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(getStorageKey(), JSON.stringify(action.payload));
        }
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload ?? 'Unable to load personalized feed.';
      });
  },
});

export const { setFeed, hydrateFeedOrder, reorderFeed } = feedSlice.actions;
export default feedSlice.reducer;
