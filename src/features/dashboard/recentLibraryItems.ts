import type { MedicationWithRelations } from '../../types/medication';
import type { ProcedureWithRelations } from '../../types/procedure';
import type { TopicWithRelations } from '../../types/topic';

export type RecentLibraryItem = {
  id: string;
  type: 'topic' | 'medication' | 'procedure';
  typeLabel: string;
  title: string;
  subtitle?: string;
  updatedAt: string;
  route: string;
};

function safeTimestamp(value: string | null | undefined) {
  if (!value) return Number.NEGATIVE_INFINITY;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

export function getRecentLibraryItems(
  topics: TopicWithRelations[],
  medications: MedicationWithRelations[],
  procedures: ProcedureWithRelations[],
  limit = 5
): RecentLibraryItem[] {
  const items: RecentLibraryItem[] = [
    ...topics.map((topic) => ({
      id: topic.id,
      type: 'topic' as const,
      typeLabel: 'Tema',
      title: topic.title || 'Tema sin título',
      subtitle: topic.subtitle ?? undefined,
      updatedAt: topic.updated_at,
      route: `/temas/${topic.id}`
    })),
    ...medications.map((medication) => ({
      id: medication.id,
      type: 'medication' as const,
      typeLabel: 'Medicamento',
      title: medication.generic_name || 'Medicamento sin nombre',
      subtitle: medication.short_description ?? medication.pharmacologic_group ?? undefined,
      updatedAt: medication.updated_at,
      route: `/farmacologia/${medication.id}`
    })),
    ...procedures.map((procedure) => ({
      id: procedure.id,
      type: 'procedure' as const,
      typeLabel: 'Procedimiento',
      title: procedure.name || 'Procedimiento sin nombre',
      subtitle: procedure.summary ?? procedure.category ?? undefined,
      updatedAt: procedure.updated_at,
      route: `/procedimientos/${procedure.id}`
    }))
  ];

  const uniqueItems = new Map<string, RecentLibraryItem>();
  for (const item of items) {
    uniqueItems.set(`${item.type}:${item.id}`, item);
  }

  return Array.from(uniqueItems.values())
    .sort((a, b) => safeTimestamp(b.updatedAt) - safeTimestamp(a.updatedAt))
    .slice(0, limit);
}
