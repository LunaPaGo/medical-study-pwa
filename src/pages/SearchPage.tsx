import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, Loader2, Pill, Search, Stethoscope } from 'lucide-react';
import { searchGlobal } from '../features/search/globalSearchEngine';
import type { SearchMatchedField, SearchResult, SearchResultType } from '../features/search/globalSearchEngine';
import { useAuth } from '../hooks/useAuth';

type SearchState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

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

export function SearchPage() {
  const { user, isReadOnly } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [state, setState] = useState<SearchState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const requestIdRef = useRef(0);
  const trimmedQuery = query.trim();

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
          results: results.filter((result) => result.type === type)
        }))
        .filter((group) => group.results.length > 0),
    [results]
  );

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
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, categoría, etiqueta, contenido o archivo" />
      </section>

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

      {state === 'ready' && (
        <div className="search-results-stack">
          {groupedResults.map((group) => (
            <section className="search-result-group" key={group.type}>
              <div className="search-result-group-heading">
                <h2>{group.label}</h2>
                <span>{group.results.length}</span>
              </div>
              <div className="search-result-list">
                {group.results.map((result) => (
                  <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  return (
    <Link className="search-result-card" to={result.route}>
      <div className="search-result-icon" aria-hidden="true">
        {iconForType(result.type)}
      </div>
      <div className="search-result-body">
        <div className="search-result-title-row">
          <span className="status-pill">{resultTypeLabels[result.type].singular}</span>
          <h3>{result.title}</h3>
        </div>
        {result.subtitle && <p className="search-result-subtitle">{result.subtitle}</p>}
        {result.snippet && <p className="search-result-snippet">{result.snippet}</p>}
        <div className="topic-meta">
          <span>{fieldLabelFor(result)}</span>
          {typeof result.metadata?.sectionLabel === 'string' && <span>Coincidencia en: {result.metadata.sectionLabel}</span>}
        </div>
      </div>
    </Link>
  );
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
