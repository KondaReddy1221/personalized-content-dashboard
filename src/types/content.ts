export type Category =
  | 'Technology'
  | 'Sports'
  | 'Finance'
  | 'Business'
  | 'Entertainment'
  | 'Science'
  | 'Health';

export type ContentType = 'news' | 'movie' | 'social';
export type Section = 'dashboard' | 'feed' | 'trending' | 'favorites' | 'settings';

export interface NewsItem {
  id: string;
  type: 'news';
  category: Category;
  source: string;
  title: string;
  description: string;
  image: string;
  publishedAt: string;
  url: string;
}

export interface MovieItem {
  id: string;
  type: 'movie';
  title: string;
  overview: string;
  poster: string;
  rating: number;
  releaseDate: string;
  genre: string;
  page: number;
}

export interface SocialItem {
  id: string;
  type: 'social';
  user: string;
  username: string;
  avatar: string;
  text: string;
  hashtags: string[];
  image?: string;
  likes: number;
}

export type FeedItem = NewsItem | MovieItem | SocialItem;

export interface FavoriteItem {
  id: string;
  type: ContentType;
  title: string;
  image: string;
}

export interface SearchResultState {
  query: string;
  items: FeedItem[];
  loading: boolean;
  error: string | null;
}
