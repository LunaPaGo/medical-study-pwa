import { loadTopicData } from '../topics/topicRepository';
import { findBestSearchMatch } from './searchUtils';
import type { SearchProvider, SearchResult } from './searchTypes';

export const topicsSearchProvider: SearchProvider = {
  id: 'topics',
  type: 'topic',
  async search(query, context) {
    const data = await loadTopicData(context.userId, context.useRemoteSync ?? false);

    return data.topics.reduce<SearchResult[]>((results, topic) => {
      const match = findBestSearchMatch(query, [
        { field: 'title', value: topic.title },
        { field: 'summary', value: topic.subtitle },
        { field: 'category', value: topic.category?.name },
        { field: 'tag', value: topic.tags.map((tag) => tag.name) }
      ]);

      if (!match) return results;

      return [
        ...results,
        {
          id: topic.id,
          type: 'topic',
          title: topic.title,
          subtitle: topic.category?.name ?? topic.subtitle ?? undefined,
          matchedField: match.matchedField,
          snippet: match.snippet,
          route: `/temas/${topic.id}`,
          score: match.score,
          metadata: {
            category: topic.category?.name,
            favorite: topic.is_favorite,
            updatedAt: topic.updated_at
          }
        }
      ];
    }, []);
  }
};
