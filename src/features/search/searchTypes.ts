export type SearchResultType = 'topic' | 'medication' | 'procedure' | 'attachment';

export type SearchMatchedField = 'title' | 'summary' | 'category' | 'tag' | 'content' | 'metadata' | 'owner';

export type SearchContext = {
  userId: string;
  useRemoteSync?: boolean;
};

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  matchedField: SearchMatchedField;
  snippet?: string;
  route: string;
  score: number;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export type SearchProvider = {
  id: string;
  type: SearchResultType;
  search: (query: string, context: SearchContext) => Promise<SearchResult[]>;
};
