import { attachmentsSearchProvider } from './attachmentsSearchProvider';
import { medicationsSearchProvider } from './medicationsSearchProvider';
import { proceduresSearchProvider } from './proceduresSearchProvider';
import { dedupeAndSortResults, tokenizeSearchQuery } from './searchUtils';
import type { SearchContext, SearchProvider } from './searchTypes';
import { topicsSearchProvider } from './topicsSearchProvider';

export const globalSearchProviders: SearchProvider[] = [
  topicsSearchProvider,
  medicationsSearchProvider,
  proceduresSearchProvider,
  attachmentsSearchProvider
];

export async function searchGlobal(query: string, context: SearchContext) {
  if (tokenizeSearchQuery(query).length === 0) return [];

  const results = await Promise.all(globalSearchProviders.map((provider) => provider.search(query, context)));
  return dedupeAndSortResults(results.flat());
}

export type { SearchContext, SearchMatchedField, SearchProvider, SearchResult, SearchResultType } from './searchTypes';
