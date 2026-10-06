'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Search,
  SunMedium,
  Moon,
  Heart,
  Bell,
  BarChart3,
  LayoutGrid,
  SlidersHorizontal,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { categories, trendingMovies, trendingNews, trendingSocial } from '@/data/mockData';
import { addCategory, removeCategory, resetPreferences } from '@/features/preferences/preferencesSlice';
import { toggleFavorite } from '@/features/favorites/favoritesSlice';
import { fetchFeed, reorderFeed } from '@/features/feed/feedSlice';
import { toggleTheme } from '@/features/theme/themeSlice';
import { useDebounce } from '@/hooks/useDebounce';
import { searchContent } from '@/utils/search';
import type { Category, FeedItem, FavoriteItem, Section } from '@/types/content';
import type { RootState, AppDispatch } from '@/store/store';

const SECTION_ITEMS: { key: Section; label: string; icon: typeof LayoutGrid }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { key: 'feed', label: 'Personalized Feed', icon: Sparkles },
  { key: 'trending', label: 'Trending', icon: BarChart3 },
  { key: 'favorites', label: 'Favorites', icon: Heart },
  { key: 'settings', label: 'Settings', icon: SlidersHorizontal },
];

export default function DashboardApp({
  initialSection = 'dashboard',
  currentUser,
}: {
  initialSection?: Section;
  currentUser?: { id: string; name: string; email: string };
}) {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useSelector((state: RootState) => state.theme.mode);
  const selectedCategories = useSelector((state: RootState) => state.preferences.selectedCategories);
  const favorites = useSelector((state: RootState) => state.favorites.items);
  const feedItems = useSelector((state: RootState) => state.feed.items);
  const feedStatus = useSelector((state: RootState) => state.feed.status);
  const feedError = useSelector((state: RootState) => state.feed.error);

  const [activeSection, setActiveSection] = useState<Section>(initialSection);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    dispatch(fetchFeed(selectedCategories));
  }, [dispatch, selectedCategories]);

  const visibleItems = useMemo(() => feedItems.slice(0, page * 6), [feedItems, page]);
  const searchResults = useMemo(
    () => searchContent(feedItems, debouncedSearch),
    [feedItems, debouncedSearch],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleToggleFavorite = (item: FeedItem) => {
    const favoriteItem: FavoriteItem = {
      id: item.id,
      type: item.type,
      title: item.type === 'news' ? item.title : item.type === 'movie' ? item.title : item.user,
      image: item.type === 'news' ? item.image : item.type === 'movie' ? item.poster : item.avatar,
    };
    dispatch(toggleFavorite(favoriteItem));
  };

  const handleCategoryToggle = (category: Category) => {
    if (selectedCategories.includes(category)) {
      dispatch(removeCategory(category));
      return;
    }
    dispatch(addCategory(category));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    dispatch(reorderFeed({ activeId: String(active.id), overId: String(over.id) }));
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-screen">
        <Sidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            theme={theme}
            onToggleTheme={() => dispatch(toggleTheme())}
            onMenuClick={() => setMobileOpen(true)}
            resultCount={searchResults.length}
            userName={currentUser?.name ?? 'Ava Brooks'}
            userEmail={currentUser?.email ?? 'ava@dashboard.io'}
            onLogout={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
          />

          <main className="flex-1 p-4 sm:p-6 xl:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {searchTerm.trim() && (
                  <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Search results</h2>
                      <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                        {debouncedSearch ? `${searchResults.length} matches` : 'Ready'}
                      </span>
                    </div>
                    {debouncedSearch && searchResults.length === 0 && !feedStatus.includes('loading') ? (
                      <EmptyState title="No results found" description="Try a different keyword or reset your preferences." />
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {searchResults.slice(0, 6).map((item) => (
                          <ContentCard
                            key={`${item.type}-${item.id}`}
                            item={item}
                            isFavorite={favorites.some(
                              (value) => value.id === item.id && value.type === item.type,
                            )}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {activeSection === 'dashboard' && (
                  <>
                    <section className="grid gap-4 md:grid-cols-3">
                      <StatCard label="Active feed" value={String(feedItems.length)} detail="items curated for you" icon={<Sparkles className="h-5 w-5" />} />
                      <StatCard label="Favorites" value={String(favorites.length)} detail="saved in your collection" icon={<Heart className="h-5 w-5" />} />
                      <StatCard label="Categories" value={String(selectedCategories.length)} detail="preferences enabled" icon={<BarChart3 className="h-5 w-5" />} />
                    </section>
                    <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
                      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                        <div className="mb-4 flex items-center justify-between">
                          <h2 className="text-xl font-semibold">Personalized overview</h2>
                          <span className="text-sm text-slate-500 dark:text-slate-400">Updated today</span>
                        </div>
                        <div className="space-y-4">
                          {feedItems.slice(0, 4).map((item) => (
                            <div key={`${item.type}-${item.id}`} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                              <div className="h-16 w-16 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700">
                                <img
                                  src={item.type === 'news' ? item.image : item.type === 'movie' ? item.poster : item.avatar}
                                  alt={item.type === 'news' ? item.title : item.type === 'movie' ? item.title : item.user}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                                  {item.type}
                                </p>
                                <h3 className="line-clamp-2 text-sm font-semibold">{item.type === 'news' ? item.title : item.type === 'movie' ? item.title : item.user}</h3>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {item.type === 'news' ? item.source : item.type === 'movie' ? item.genre : item.username}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                        <h3 className="mb-4 text-xl font-semibold">Your mix</h3>
                        <div className="space-y-4">
                          {selectedCategories.map((category) => (
                            <div key={category}>
                              <div className="mb-1 flex items-center justify-between text-sm">
                                <span>{category}</span>
                                <span className="font-medium text-indigo-600 dark:text-indigo-300">
                                  {Math.max(48, 100 - selectedCategories.indexOf(category) * 10)}%
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                                  style={{ width: `${Math.max(48, 100 - selectedCategories.indexOf(category) * 12)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  </>
                )}

                {activeSection === 'feed' && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">Your personalized feed</h2>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                        onClick={() => dispatch(fetchFeed(selectedCategories))}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </button>
                    </div>

                    {feedStatus === 'loading' && (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                        ))}
                      </div>
                    )}

                    {feedStatus === 'error' && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                        <p className="font-medium">{feedError}</p>
                        <button
                          type="button"
                          onClick={() => dispatch(fetchFeed(selectedCategories))}
                          className="mt-3 rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {feedStatus !== 'loading' && feedStatus !== 'error' && visibleItems.length === 0 && (
                      <EmptyState title="No feed items" description="Try adding more categories to your preferences." />
                    )}

                    {visibleItems.length > 0 && (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={visibleItems.map((item) => item.id)} strategy={rectSortingStrategy}>
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {visibleItems.map((item) => (
                              <SortableContentCard
                                key={item.id}
                                item={item}
                                isFavorite={favorites.some((value) => value.id === item.id && value.type === item.type)}
                                onToggleFavorite={handleToggleFavorite}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}

                    {feedItems.length > visibleItems.length && (
                      <div className="flex justify-center pt-2">
                        <button
                          type="button"
                          onClick={() => setPage((previous) => previous + 1)}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500"
                        >
                          Load more <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </section>
                )}

                {activeSection === 'trending' && (
                  <section className="space-y-6">
                    <TrendingSection title="Trending news" items={trendingNews} />
                    <TrendingSection title="Trending movies" items={trendingMovies} />
                    <TrendingSection title="Trending social posts" items={trendingSocial} />
                  </section>
                )}

                {activeSection === 'favorites' && (
                  <section className="space-y-4">
                    <h2 className="text-2xl font-bold">Favorite items</h2>
                    {favorites.length === 0 ? (
                      <EmptyState title="No favorites yet" description="Tap the heart icon on any card to save it here." />
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {favorites.map((item) => (
                          <div key={`${item.type}-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <div className="mb-3 h-40 overflow-hidden rounded-xl">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                                {item.type}
                              </span>
                              <button
                                type="button"
                                aria-label={`Remove ${item.title} from favorites`}
                                onClick={() => dispatch(toggleFavorite(item))}
                                className="rounded-full bg-rose-100 p-2 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200"
                              >
                                <Heart className="h-4 w-4 fill-current" />
                              </button>
                            </div>
                            <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {activeSection === 'settings' && (
                  <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">Preferences</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Choose the categories that shape your personalized feed.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dispatch(resetPreferences())}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Reset
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {categories.map((category) => {
                        const active = selectedCategories.includes(category);
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => handleCategoryToggle(category)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                              active
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {category}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedCategories.length} categories selected
                      </p>
                      <button
                        type="button"
                        onClick={() => dispatch(fetchFeed(selectedCategories))}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                      >
                        Save preferences
                      </button>
                    </div>
                  </section>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  activeSection,
  onSelectSection,
  isOpen,
  onClose,
}: {
  activeSection: Section;
  onSelectSection: (section: Section) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const sidebar = (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white/85 p-4 backdrop-blur dark:border-slate-700 dark:bg-slate-950/90">
      <div className="mb-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            P
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Personalized</p>
            <h1 className="text-lg font-bold">Dashboard</h1>
          </div>
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 md:hidden dark:text-slate-200"
          aria-label="Close navigation"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="space-y-2">
        {SECTION_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            aria-label={label}
            onClick={() => {
              onSelectSection(key);
              onClose();
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              activeSection === key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 p-4 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.18em] text-indigo-100">Insight</p>
        <p className="mt-2 text-sm font-medium">Your recommendations are refreshed based on your latest preferences.</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-72 shrink-0 md:block">{sidebar}</aside>
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -32, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-y-0 left-0 z-40 w-72 md:hidden"
          >
            {sidebar}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function Header({
  searchTerm,
  onSearchChange,
  theme,
  onToggleTheme,
  onMenuClick,
  resultCount,
  userName,
  userEmail,
  onLogout,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onMenuClick: () => void;
  resultCount: number;
  userName: string;
  userEmail: string;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-950/85 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-lg border border-slate-200 p-2 text-slate-700 md:hidden dark:border-slate-700 dark:text-slate-200"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative w-full max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search content"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search news, movies, and posts"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:flex">
            <Bell className="h-4 w-4" />
            <span>{resultCount}</span>
          </div>

          <button
            type="button"
            aria-label="Toggle theme"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-semibold text-white">
              {userName
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'AB'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold">{userName}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{userEmail}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="hidden rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-flex dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/60">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

type TrendingItem = {
  type?: 'news' | 'movie' | 'social';
  title?: string;
  description?: string;
  overview?: string;
  user?: string;
  image?: string;
  poster?: string;
  avatar?: string;
  text?: string;
  category?: string;
};

function TrendingSection({ title, items }: { title: string; items: TrendingItem[] }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold">{title}</h3>
        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-200">
          Top picks
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            <div className="relative h-40 overflow-hidden">
              <img
                src={item.type === 'movie' ? item.poster : item.type === 'social' ? item.image ?? item.avatar : item.image}
                alt={item.type === 'movie' ? item.title : item.type === 'social' ? item.user : item.title}
                className="h-full w-full object-cover"
              />
              <span className="absolute left-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/75 text-xs font-bold text-white">
                #{index + 1}
              </span>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                {item.type === 'movie' ? 'movie' : item.type === 'social' ? 'social' : item.category}
              </p>
              <h4 className="mt-2 text-base font-semibold">{item.type === 'movie' ? item.title : item.type === 'social' ? item.user : item.title}</h4>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                {item.type === 'movie' ? item.overview : item.type === 'social' ? item.text : item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentCard({
  item,
  isFavorite,
  onToggleFavorite,
}: {
  item: FeedItem;
  isFavorite: boolean;
  onToggleFavorite: (item: FeedItem) => void;
}) {
  if (item.type === 'news') {
    return (
      <motion.article layout className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="relative h-44 overflow-hidden">
          <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-700 dark:bg-slate-900/80 dark:text-slate-100">
            {item.category}
          </span>
          <button
            type="button"
            aria-label={`Favorite ${item.title}`}
            onClick={() => onToggleFavorite(item)}
            className={`absolute right-3 top-3 rounded-full p-2 ${isFavorite ? 'bg-rose-600 text-white' : 'bg-white/90 text-slate-700 dark:bg-slate-900/80 dark:text-slate-100'}`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{item.source}</span>
            <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
          </div>
          <h3 className="text-lg font-semibold leading-snug">{item.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
          <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-300">
            Read More <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.article>
    );
  }

  if (item.type === 'movie') {
    return (
      <motion.article layout className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="relative h-52 overflow-hidden">
          <img src={item.poster} alt={item.title} className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label={`Favorite ${item.title}`}
            onClick={() => onToggleFavorite(item)}
            className={`absolute right-3 top-3 rounded-full p-2 ${isFavorite ? 'bg-rose-600 text-white' : 'bg-white/90 text-slate-700 dark:bg-slate-900/80 dark:text-slate-100'}`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">★ {item.rating.toFixed(1)}</span>
            <span>{item.releaseDate}</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm text-indigo-600 dark:text-indigo-300">{item.genre}</p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{item.overview}</p>
          <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-300">
            View Details <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article layout className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-700">
        <img src={item.avatar} alt={item.user} className="h-11 w-11 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.user}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{item.username}</p>
        </div>
        <button
          type="button"
          aria-label={`Favorite ${item.user}'s post`}
          onClick={() => onToggleFavorite(item)}
          className={`ml-auto rounded-full p-2 ${isFavorite ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-100'}`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-sm text-slate-700 dark:text-slate-200">{item.text}</p>
        <div className="flex flex-wrap gap-2">
          {item.hashtags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {tag}
            </span>
          ))}
        </div>
        {item.image && (
          <div className="overflow-hidden rounded-xl">
            <img src={item.image} alt={item.user} className="h-48 w-full object-cover" />
          </div>
        )}
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>❤ {item.likes.toLocaleString()}</span>
        </div>
      </div>
    </motion.article>
  );
}

function SortableContentCard({
  item,
  isFavorite,
  onToggleFavorite,
}: {
  item: FeedItem;
  isFavorite: boolean;
  onToggleFavorite: (item: FeedItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={isDragging ? 'opacity-60' : 'opacity-100'}>
      <ContentCard item={item} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
    </div>
  );
}
