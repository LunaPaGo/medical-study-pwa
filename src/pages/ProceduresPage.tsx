import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardPlus, Search } from 'lucide-react';
import { ProcedureCard } from '../features/procedures/ProcedureCard';
import { filterProcedures } from '../features/procedures/procedureRepository';
import { useProcedureData, useProcedureMutations } from '../features/procedures/useProcedureData';
import { useAuth } from '../hooks/useAuth';
import type { ProcedureSort, ProcedureWithRelations } from '../types/procedure';

type Props = {
  favoritesOnly?: boolean;
};

export function ProceduresPage({ favoritesOnly = false }: Props) {
  const { data, isLoading } = useProcedureData();
  const mutations = useProcedureMutations();
  const { isReadOnly } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [tagId, setTagId] = useState('');
  const [status, setStatus] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [sort, setSort] = useState<ProcedureSort>('updated_desc');

  const categories = useMemo(
    () =>
      Array.from(new Set((data?.procedures ?? []).map((procedure) => procedure.category).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b, 'es')
      ),
    [data?.procedures]
  );

  const procedures = useMemo(
    () =>
      filterProcedures(data?.procedures ?? [], {
        search,
        category,
        tagId,
        status: status as '' | 'draft' | 'complete',
        favoriteOnly: favoritesOnly || favoriteOnly,
        sort
      }),
    [category, data?.procedures, favoriteOnly, favoritesOnly, search, sort, status, tagId]
  );

  const remove = (procedure: ProcedureWithRelations) => {
    if (window.confirm(`¿Eliminar "${procedure.name}"? Esta acción también se sincronizará con Supabase.`)) {
      mutations.deleteProcedure.mutate(procedure.id);
    }
  };

  return (
    <section className="page-stack">
      <div className="page-heading page-heading-actions">
        <div>
          <span>Procedimientos</span>
          <h1>{favoritesOnly ? 'Procedimientos favoritos' : 'Procedimientos'}</h1>
          <p>
            {favoritesOnly
              ? 'Procedimientos marcados como favoritos.'
              : 'Guías breves para técnica, preparación, consideraciones y cuidados.'}
          </p>
        </div>
        <div className="heading-actions">
          {isReadOnly ? (
            <span className="notice warning readonly-inline">Modo sin conexión: solo lectura.</span>
          ) : (
            !favoritesOnly && (
              <Link className="primary-button" to="/procedimientos/nuevo">
                <ClipboardPlus size={18} />
                Nuevo procedimiento
              </Link>
            )
          )}
        </div>
      </div>

      <section className="panel filter-panel">
        <Search size={20} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, resumen, categoría, etiqueta o contenido" />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">Todas las categorías</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select value={tagId} onChange={(event) => setTagId(event.target.value)}>
          <option value="">Todas las etiquetas</option>
          {data?.tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="complete">Completo</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as ProcedureSort)}>
          <option value="updated_desc">Modificación reciente</option>
          <option value="name_asc">Nombre alfabético</option>
          <option value="created_desc">Creación reciente</option>
          <option value="favorite_desc">Favoritos primero</option>
        </select>
        {!favoritesOnly && (
          <label className="checkbox-label">
            <input checked={favoriteOnly} type="checkbox" onChange={(event) => setFavoriteOnly(event.target.checked)} />
            Favoritos
          </label>
        )}
      </section>

      {isLoading && <div className="panel empty-state">Cargando procedimientos...</div>}

      <div className="topic-list">
        {procedures.map((procedure) => (
          <ProcedureCard
            key={procedure.id}
            procedure={procedure}
            readOnly={isReadOnly}
            onDelete={remove}
            onToggleFavorite={(item) => mutations.toggleFavorite.mutate(item)}
          />
        ))}
      </div>

      {!isLoading && procedures.length === 0 && (
        <div className="panel empty-state">{favoritesOnly ? 'Todavía no hay procedimientos favoritos.' : 'Todavía no hay procedimientos con estos filtros.'}</div>
      )}
    </section>
  );
}
