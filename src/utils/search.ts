import type { FeedItem } from '@/types/content';

export function searchContent(items: FeedItem[], term: string): FeedItem[] {
  const normalizedTerm = term.trim().toLowerCase();

  if (!normalizedTerm) {
    return [];
  }

  return items.filter((item) => {
    const searchText = [
      item.type === 'news' ? [item.title, item.description, item.source, item.category].join(' ') : '',
      item.type === 'movie' ? [item.title, item.overview, item.genre, item.releaseDate].join(' ') : '',
      item.type === 'social' ? [item.user, item.username, item.text, ...(item.hashtags ?? [])].join(' ') : '',
    ]
      .join(' ')
      .toLowerCase();

    return searchText.includes(normalizedTerm);
  });
}
