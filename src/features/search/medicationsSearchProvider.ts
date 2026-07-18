import { loadMedicationData } from '../medications/medicationRepository';
import { medicationStudySections } from '../medications/medicationStudySectionCatalog';
import { buildRichTextSections } from './richTextSearch';
import { findBestSearchMatch } from './searchUtils';
import type { SearchProvider, SearchResult } from './searchTypes';

export const medicationsSearchProvider: SearchProvider = {
  id: 'medications',
  type: 'medication',
  async search(query, context) {
    const data = await loadMedicationData(context.userId, context.useRemoteSync ?? false);

    return data.medications.reduce<SearchResult[]>((results, medication) => {
      const title = medication.generic_name?.trim() || 'Medicamento sin nombre';
      const richSections = buildRichTextSections(medication, medicationStudySections);
      const match = findBestSearchMatch(query, [
        { field: 'title', value: title },
        { field: 'summary', value: medication.short_description },
        { field: 'category', value: [medication.pharmacologic_group, medication.pharmacologic_subgroup].filter(Boolean) as string[] },
        { field: 'tag', value: medication.tags.map((tag) => tag.name) },
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
          id: medication.id,
          type: 'medication',
          title,
          subtitle: medication.pharmacologic_group ?? medication.short_description ?? undefined,
          matchedField: match.matchedField,
          snippet: match.snippet,
          route: `/farmacologia/${medication.id}`,
          score: match.score,
          metadata: {
            group: medication.pharmacologic_group,
            subgroup: medication.pharmacologic_subgroup,
            favorite: medication.is_favorite,
            sectionId: match.sectionId,
            sectionLabel: match.sectionLabel,
            updatedAt: medication.updated_at
          }
        }
      ];
    }, []);
  }
};
