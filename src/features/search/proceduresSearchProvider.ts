import { loadProcedureData } from '../procedures/procedureRepository';
import { procedureStudySections } from '../procedures/procedureSectionCatalog';
import { buildRichTextSections } from './richTextSearch';
import { findBestSearchMatch } from './searchUtils';
import type { SearchProvider, SearchResult } from './searchTypes';

export const proceduresSearchProvider: SearchProvider = {
  id: 'procedures',
  type: 'procedure',
  async search(query, context) {
    const data = await loadProcedureData(context.userId, context.useRemoteSync ?? false);

    return data.procedures.reduce<SearchResult[]>((results, procedure) => {
      const richSections = buildRichTextSections(procedure, procedureStudySections);
      const match = findBestSearchMatch(query, [
        { field: 'title', value: procedure.name },
        { field: 'summary', value: procedure.summary },
        { field: 'category', value: procedure.category },
        { field: 'tag', value: procedure.tags.map((tag) => tag.name) },
        ...richSections.map((section) => ({
          field: 'content' as const,
          value: section.text,
          sectionId: section.sectionId,
          sectionLabel: section.sectionLabel
        }))
      ]);

      if (!match) return results;

      return [
        ...results,
        {
          id: procedure.id,
          type: 'procedure',
          title: procedure.name,
          subtitle: procedure.category ?? procedure.summary ?? undefined,
          matchedField: match.matchedField,
          snippet: match.snippet,
          route: `/procedimientos/${procedure.id}`,
          score: match.score,
          metadata: {
            category: procedure.category,
            favorite: procedure.is_favorite,
            sectionId: match.sectionId,
            sectionLabel: match.sectionLabel,
            updatedAt: procedure.updated_at
          }
        }
      ];
    }, []);
  }
};
