import type { SearchMatchedField, SearchResult } from './searchTypes';

type SearchField = {
  field: SearchMatchedField;
  value: string | string[] | null | undefined;
  sectionId?: string;
  sectionLabel?: string;
};

type SearchMatch = {
  matchedField: SearchMatchedField;
  snippet?: string;
  score: number;
  sectionId?: string;
  sectionLabel?: string;
};

const fieldWeights: Record<SearchMatchedField, number> = {
  title: 70,
  category: 55,
  tag: 55,
  summary: 40,
  content: 35,
  owner: 45,
  metadata: 30
};

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeSearchQuery(query: string) {
  const normalized = normalizeSearchText(query);
  return normalized ? normalized.split(' ').filter(Boolean) : [];
}

export function createSnippet(value: string, query: string, length = 140) {
  const cleanValue = value.replace(/\s+/g, ' ').trim();
  if (cleanValue.length <= length) return cleanValue;

  const normalizedValue = normalizeSearchText(cleanValue);
  const normalizedQuery = normalizeSearchText(query);
  const queryTerms = tokenizeSearchQuery(query);
  const index =
    normalizedValue.indexOf(normalizedQuery) >= 0
      ? normalizedValue.indexOf(normalizedQuery)
      : Math.min(...queryTerms.map((term) => normalizedValue.indexOf(term)).filter((termIndex) => termIndex >= 0));
  const start = index > 20 ? index - 20 : 0;
  const end = Math.min(cleanValue.length, start + length);
  return `${start > 0 ? '...' : ''}${cleanValue.slice(start, end)}${end < cleanValue.length ? '...' : ''}`;
}

export function findBestSearchMatch(query: string, fields: SearchField[]): SearchMatch | null {
  const terms = tokenizeSearchQuery(query);
  if (terms.length === 0) return null;

  const allValues = fields.flatMap((field) => normalizeValues(field.value));
  const combined = normalizeSearchText(allValues.join(' '));
  if (terms.some((term) => !combined.includes(term))) return null;

  const normalizedQuery = normalizeSearchText(query);
  let bestMatch: SearchMatch | null = null;

  fields.forEach((field) => {
    normalizeValues(field.value).forEach((value) => {
      const normalizedValue = normalizeSearchText(value);
      if (!normalizedValue) return;

      const matchedTerms = terms.filter((term) => normalizedValue.includes(term)).length;
      if (matchedTerms === 0) return;

      let score = fieldWeights[field.field] + matchedTerms * 2;
      if (field.field === 'title') {
        if (normalizedValue === normalizedQuery) {
          score = 100;
        } else if (normalizedValue.startsWith(normalizedQuery)) {
          score = 85;
        } else if (terms.every((term) => normalizedValue.includes(term))) {
          score = 70;
        }
      }

      const match = {
        matchedField: field.field,
        snippet: createSnippet(value, query),
        score,
        sectionId: field.sectionId,
        sectionLabel: field.sectionLabel
      };

      if (!bestMatch || match.score > bestMatch.score) {
        bestMatch = match;
      }
    });
  });

  return bestMatch;
}

export function dedupeAndSortResults(results: SearchResult[]) {
  const byKey = new Map<string, SearchResult>();

  results.forEach((result) => {
    const key = `${result.type}:${result.id}`;
    const current = byKey.get(key);
    if (!current || result.score > current.score) {
      byKey.set(key, result);
    }
  });

  return [...byKey.values()].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
  });
}

function normalizeValues(value: SearchField['value']) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}
