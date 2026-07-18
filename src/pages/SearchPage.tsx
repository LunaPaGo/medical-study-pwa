import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, Loader2, Pill, Search, Stethoscope, X } from 'lucide-react';
import { searchGlobal } from '../features/search/globalSearchEngine';
import type { SearchMatchedField, SearchResult, SearchResultType } from '../features/search/globalSearchEngine';
import { normalizeSearchText, tokenizeSearchQuery } from '../features/search/searchUtils';
import { useAuth } from '../hooks/useAuth';

type SearchState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';
type SearchFilter = 'all' | SearchResultType;

const resultTypeLabels: Record<SearchResultType, { singular: string; plural: string }> = {
  topic: { singular: 'Tema', plural: 'Temas' },
  medication: { singular: 'Fármaco', plural: 'Fármacos' },
  procedure: { singular: 'Procedimiento', plural: 'Procedimientos' },
  attachment: { singular: 'Archivo', plural: 'Archivos' }
};

const matchedFieldLabels: Record<SearchMatchedField, string> = {
  title: 'Título',
  summary: 'Resumen',
  category: 'Categoría',
  tag: 'Etiquetas',
  content: 'Contenido',
  metadata: 'Nombre del archivo',
  owner: 'Propietario'
};

const groupOrder: SearchResultType[] = ['topic', 'medication', 'procedure', 'attachment'];
const filterOrder: SearchFilter[] = ['all', ...groupOrder];

export function SearchPage() {
  const { user, isReadOnly } = useAuth();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [state, setState] = useState<SearchState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const requestIdRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmedQuery = query.trim();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!user || trimmedQuery.length === 0) {
      requestIdRef.current += 1;
      setResults([]);
      setErrorMessage('');
      setState('idle');
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState('loading');
    setErrorMessage('');

    const timeoutId = window.setTimeout(() => {
      searchGlobal(trimmedQuery, { userId: user.id, useRemoteSync: false })
        .then((items) => {
          if (requestIdRef.current !== requestId) return;
          setResults(items);
          setState(items.length > 0 ? 'ready' : 'empty');
        })
        .catch((error) => {
          console.error('GLOBAL_SEARCH_FAILED', error);
          if (requestIdRef.current !== requestId) return;
          setResults([]);
          setErrorMessage('No se pudo completar la búsqueda. Probá de nuevo en unos segundos.');
          setState('error');
        });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [trimmedQuery, user]);

  const groupedResults = useMemo(
    () =>
      groupOrder
        .map((type) => ({
          type,
          label: resultTypeLabels[type].plural,
          results: results.filter((result) => result.type === type && (activeFilter === 'all' || result.type === activeFilter))
        }))
        .filter((group) => group.results.length > 0),
    [activeFilter, results]
  );

  const resultCounts = useMemo(
    () => ({
      all: results.length,
      topic: results.filter((result) => result.type === 'topic').length,
      medication: results.filter((result) => result.type === 'medication').length,
      procedure: results.filter((result) => result.type === 'procedure').length,
      attachment: results.filter((result) => result.type === 'attachment').length
    }),
    [results]
  );

  const filteredResultCount = activeFilter === 'all' ? results.length : resultCounts[activeFilter];
  const showFilters = trimmedQuery.length > 0 && state !== 'idle';

  return (
    <section className="page-stack">
      <div className="page-heading page-heading-actions">
        <div>
          <span>Buscador global</span>
          <h1>Buscar en la biblioteca médica</h1>
          <p>Encontrá temas, fármacos, procedimientos y archivos guardados en este dispositivo.</p>
        </div>
        {isReadOnly && <span className="notice warning readonly-inline">Modo sin conexión: solo lectura.</span>}
      </div>

      <section className="panel global-search-panel">
        <Search size={20} />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por título, categoría, etiqueta, contenido o archivo"
        />
        {query.length > 0 && (
          <button className="search-clear-button" type="button" onClick={() => setQuery('')} aria-label="Limpiar búsqueda">
            <X size={18} />
          </button>
        )}
      </section>

      {showFilters && (
        <div className="search-filter-bar" role="group" aria-label="Filtrar resultados por tipo">
          {filterOrder.map((filter) => (
            <button
              className={`search-filter-chip ${activeFilter === filter ? 'active' : ''}`}
              type="button"
              key={filter}
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
            >
              <span>{filterLabel(filter)}</span>
              <strong>{resultCounts[filter]}</strong>
            </button>
          ))}
        </div>
      )}

      {state === 'idle' && (
        <div className="panel empty-state">Escribí una palabra o frase para buscar en los datos ya sincronizados.</div>
      )}

      {state === 'loading' && (
        <div className="panel search-loading">
          <Loader2 className="spin-icon" size={20} />
          Buscando...
        </div>
      )}

      {state === 'error' && <div className="panel empty-state">{errorMessage}</div>}

      {state === 'empty' && <div className="panel empty-state">No se encontraron resultados para “{trimmedQuery}”.</div>}

      {state === 'ready' && filteredResultCount === 0 && (
        <div className="panel empty-state">No hay resultados de este tipo para “{trimmedQuery}”.</div>
      )}

      {state === 'ready' && filteredResultCount > 0 && (
        <div className="search-results-stack">
          {groupedResults.map((group) => (
            <section className="search-result-group" key={group.type}>
              <div className="search-result-group-heading">
                <h2>{group.label}</h2>
                <span>{group.results.length}</span>
              </div>
              <div className="search-result-list">
                {group.results.map((result) => (
                  <SearchResultCard key={`${result.type}-${result.id}`} query={trimmedQuery} result={result} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function SearchResultCard({ query, result }: { query: string; result: SearchResult }) {
  return (
    <Link className="search-result-card" to={result.route}>
      <div className="search-result-icon" aria-hidden="true">
        {iconForType(result.type)}
      </div>
      <div className="search-result-body">
        <div className="search-result-title-row">
          <span className="status-pill">{resultTypeLabels[result.type].singular}</span>
          <h3>
            <HighlightedText query={query} text={result.title} />
          </h3>
        </div>
        {result.subtitle && (
          <p className="search-result-subtitle">
            <HighlightedText query={query} text={result.subtitle} />
          </p>
        )}
        {result.snippet && (
          <p className="search-result-snippet">
            <HighlightedText query={query} text={result.snippet} />
          </p>
        )}
        <div className="topic-meta">
          <span>{fieldLabelFor(result)}</span>
          {typeof result.metadata?.sectionLabel === 'string' && <span>Coincidencia en: {result.metadata.sectionLabel}</span>}
        </div>
      </div>
    </Link>
  );
}

function HighlightedText({ query, text }: { query: string; text: string }) {
  const parts = splitHighlightedText(text, query);
  return (
    <>
      {parts.map((part, index) =>
        part.highlight ? (
          <mark key={`${part.text}-${index}`}>{part.text}</mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        )
      )}
    </>
  );
}

function splitHighlightedText(text: string, query: string) {
  const terms = Array.from(new Set(tokenizeSearchQuery(query))).sort((a, b) => b.length - a.length);
  if (!text || terms.length === 0) return [{ text, highlight: false }];

  const normalized = buildNormalizedIndex(text);
  const ranges: Array<{ start: number; end: number }> = [];

  terms.forEach((term) => {
    let searchIndex = 0;
    while (searchIndex < normalized.text.length) {
      const matchIndex = normalized.text.indexOf(term, searchIndex);
      if (matchIndex < 0) break;
      const start = normalized.map[matchIndex];
      const end = normalized.map[matchIndex + term.length - 1] + 1;
      ranges.push({ start, end });
      searchIndex = matchIndex + term.length;
    }
  });

  const mergedRanges = mergeRanges(ranges);
  if (mergedRanges.length === 0) return [{ text, highlight: false }];

  const parts: Array<{ text: string; highlight: boolean }> = [];
  let cursor = 0;
  mergedRanges.forEach((range) => {
    if (range.start > cursor) {
      parts.push({ text: text.slice(cursor, range.start), highlight: false });
    }
    parts.push({ text: text.slice(range.start, range.end), highlight: true });
    cursor = range.end;
  });
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), highlight: false });
  }

  return parts;
}

function buildNormalizedIndex(text: string) {
  const normalizedChars: string[] = [];
  const map: number[] = [];

  Array.from(text).forEach((char, originalIndex) => {
    const normalizedChar = normalizeSearchText(char);
    Array.from(normalizedChar).forEach((part) => {
      normalizedChars.push(part);
      map.push(originalIndex);
    });
  });

  return { text: normalizedChars.join(''), map };
}

function mergeRanges(ranges: Array<{ start: number; end: number }>) {
  return ranges
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start - b.start)
    .reduce<Array<{ start: number; end: number }>>((merged, range) => {
      const previous = merged[merged.length - 1];
      if (!previous || range.start > previous.end) {
        return [...merged, range];
      }
      previous.end = Math.max(previous.end, range.end);
      return merged;
    }, []);
}

function filterLabel(filter: SearchFilter) {
  if (filter === 'all') return 'Todo';
  return resultTypeLabels[filter].plural;
}

function fieldLabelFor(result: SearchResult) {
  if (result.type === 'attachment' && result.matchedField === 'title') return 'Nombre del archivo';
  return matchedFieldLabels[result.matchedField];
}

function iconForType(type: SearchResultType) {
  if (type === 'topic') return <BookOpen size={22} />;
  if (type === 'medication') return <Pill size={22} />;
  if (type === 'procedure') return <Stethoscope size={22} />;
  return <FileText size={22} />;
}
