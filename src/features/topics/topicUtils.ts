import type { TopicSort, TopicWithRelations } from '../../types/topic';

export function stripHtml(html: string) {
  const element = document.createElement('div');
  element.innerHTML = html;
  return element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function filterTopics(
  topics: TopicWithRelations[],
  filters: {
    search: string;
    folderId: string;
    categoryId: string;
    specialty: string;
    favoriteOnly: boolean;
    sort: TopicSort;
  }
) {
  const needle = filters.search.trim().toLowerCase();

  return topics
    .filter((topic) => {
      const searchable = [
        topic.title,
        topic.subtitle ?? '',
        stripHtml(topic.content_html),
        topic.folder?.name ?? '',
        topic.category?.name ?? '',
        topic.specialty ?? '',
        ...topic.tags.map((tag) => tag.name)
      ]
        .join(' ')
        .toLowerCase();

      return (
        (!needle || searchable.includes(needle)) &&
        (!filters.folderId || topic.folder_id === filters.folderId) &&
        (!filters.categoryId || topic.category_id === filters.categoryId) &&
        (!filters.specialty || topic.specialty === filters.specialty) &&
        (!filters.favoriteOnly || topic.is_favorite)
      );
    })
    .sort((a, b) => {
      if (filters.sort === 'title_asc') return a.title.localeCompare(b.title, 'es');
      return b.updated_at.localeCompare(a.updated_at);
    });
}
