import { defaultPreferences, mockMovies, mockNews, mockSocialPosts } from '@/data/mockData';
import type { Category, FeedItem } from '@/types/content';

type NewsApiArticle = {
  source?: { name?: string };
  title?: string;
  description?: string;
  urlToImage?: string;
  publishedAt?: string;
  url?: string;
};

type TmdbMovie = {
  title?: string;
  overview?: string;
  poster_path?: string;
  vote_average?: number;
  release_date?: string;
};

const newsApiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY;
const tmdbApiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export const normalizeDate = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));

export async function fetchNewsForCategories(categories: Category[] = defaultPreferences): Promise<FeedItem[]> {
  const activeCategories = categories.length ? categories : defaultPreferences;

  if (newsApiKey) {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=5&apiKey=${newsApiKey}`,
      );
      if (response.ok) {
        const payload = await response.json();
        if (payload.articles?.length) {
          return payload.articles.map((article: NewsApiArticle, index: number) => ({
            id: `news-${index}`,
            type: 'news',
            category: activeCategories[index % activeCategories.length],
            source: article.source?.name ?? 'News API',
            title: article.title ?? 'Untitled article',
            description: article.description ?? 'News content is available.',
            image: article.urlToImage ?? 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=900&q=80',
            publishedAt: article.publishedAt ?? new Date().toISOString(),
            url: article.url ?? '#',
          }));
        }
      }
    } catch {
      // Fall back to mock data automatically below.
    }
  }

  return mockNews.filter((item) => activeCategories.includes(item.category)).slice(0, 6);
}

export async function fetchMoviesForCategories(categories: Category[] = defaultPreferences): Promise<FeedItem[]> {
  const activeCategories = categories.length ? categories : defaultPreferences;

  if (tmdbApiKey) {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${tmdbApiKey}&language=en-US&page=1&sort_by=popularity.desc`,
      );
      if (response.ok) {
        const payload = await response.json();
        if (payload.results?.length) {
          return payload.results.slice(0, 4).map((movie: TmdbMovie, index: number) => ({
            id: `movie-${index}`,
            type: 'movie',
            title: movie.title ?? 'Movie title',
            overview: movie.overview ?? 'No overview available.',
            poster:
              movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=700&q=80',
            rating: Number(movie.vote_average ?? 7.5),
            releaseDate: movie.release_date ?? '2026-01-01',
            genre: activeCategories[index % activeCategories.length],
            page: 1,
          }));
        }
      }
    } catch {
      // Fall through to mock data.
    }
  }

  return mockMovies.slice(0, 4);
}

export async function fetchSocialPosts(): Promise<FeedItem[]> {
  return mockSocialPosts;
}

export async function fetchDashboardContent(categories: Category[] = defaultPreferences): Promise<FeedItem[]> {
  const [news, movies, social] = await Promise.all([
    fetchNewsForCategories(categories),
    fetchMoviesForCategories(categories),
    fetchSocialPosts(),
  ]);

  return [...news, ...movies, ...social];
}
