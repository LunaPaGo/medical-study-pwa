import { useMemo, useState } from 'react';
import { BookPlus, Grid2X2, List, SlidersHorizontal } from 'lucide-react';
import { PrimaryActionButton } from '../components/ui/PrimaryActionButton';
import { OrganizationManager } from '../features/topics/OrganizationManager';
import { TopicCard } from '../features/topics/TopicCard';
import { useStudyListViewPreference } from '../features/theme/useStudyListViewPreference';
import { filterTopics } from '../features/topics/topicUtils';
import { useTopicData, useTopicMutations } from '../features/topics/useTopicData';
import { useAuth } from '../hooks/useAuth';
import type { TopicSort, TopicWithRelations } from '../types/topic';

type Props = {
  favoritesOnly?: boolean;
};

export function TopicsPage({ favoritesOnly = false }: Props) {
  const { data, isLoading } = useTopicData();
  const mutations = useTopicMutations();
  const { isReadOnly } = useAuth();
  const [search, setSearch] = useState('');
  const [folderId, setFolderId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [sort, setSort] = useState<TopicSort>('updated_desc');
  const [showOrganization, setShowOrganization] = useState(false);
  const { viewMode, setViewMode } = useStudyListViewPreference();

  const specialties = useMemo(
    () =>
      Array.from(new Set((data?.topics ?? []).map((topic) => topic.specialty).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b, 'es')
      ),
    [data?.topics]
  );

  const topics = useMemo(
    () =>
      filterTopics(data?.topics ?? [], {
        search,
        folderId,
        categoryId,
        specialty,
        favoriteOnly: favoritesOnly,
        sort
      }),
    [categoryId, data?.topics, favoritesOnly, folderId, search, sort, specialty]
  );

  const remove = (topic: TopicWithRelations) => {
    if (window.confirm(`¿Eliminar "${topic.title}"? Esta acción también se sincronizará con Supabase.`)) {
      mutations.deleteTopic.mutate(topic.id);
    }
  };

  return (
    <section className="page-stack">
      <div className="page-heading page-heading-actions">
        <div>
          <span>Etapa 2</span>
          <h1>{favoritesOnly ? 'Favoritos' : 'Temas médicos'}</h1>
          <p>
            {favoritesOnly
              ? 'Temas marcados para volver rápido a lo importante.'
              : 'Creá, buscá y organizá contenido médico con carpetas, categorías y etiquetas.'}
          </p>
        </div>
        <div className="heading-actions">
          {!favoritesOnly && !isReadOnly && (
            <button className="ghost-button" type="button" onClick={() => setShowOrganization((value) => !value)}>
              <SlidersHorizontal size={18} />
              Organización
            </button>
          )}
          <div className="view-switch" aria-label="Modo de visualización">
            <button className={`ghost-button ${viewMode === 'list' ? 'active' : ''}`} type="button" onClick={() => setViewMode('list')}>
              <List size={18} />
              Lista
            </button>
            <button className={`ghost-button ${viewMode === 'grid' ? 'active' : ''}`} type="button" onClick={() => setViewMode('grid')}>
              <Grid2X2 size={18} />
              Tarjetas
            </button>
          </div>
          {isReadOnly ? (
            <span className="notice warning readonly-inline">Modo sin conexión: solo lectura.</span>
          ) : (
            <PrimaryActionButton aria-label="Nuevo tema" icon={<BookPlus />} iconOnlyOnMobile to="/temas/nuevo">
              Nuevo
            </PrimaryActionButton>
          )}
        </div>
      </div>

      {!favoritesOnly && showOrganization && data && (
        <div className="organization-grid">
          <OrganizationManager kind="folders" title="Carpetas" items={data.folders} topics={data.topics} />
          <OrganizationManager kind="categories" title="Categorías" items={data.categories} topics={data.topics} />
          <OrganizationManager kind="tags" title="Etiquetas" items={data.tags} topics={data.topics} />
        </div>
      )}

      <section className="panel filter-panel">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por título, texto, etiqueta, carpeta o especialidad" />
        <select value={folderId} onChange={(event) => setFolderId(event.target.value)}>
          <option value="">Todas las carpetas</option>
          {data?.folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">Todas las categorías</option>
          {data?.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
          <option value="">Todas las especialidades</option>
          {specialties.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as TopicSort)}>
          <option value="updated_desc">Modificación reciente</option>
          <option value="title_asc">Orden alfabético</option>
        </select>
      </section>

      {isLoading && <div className="panel empty-state">Cargando temas...</div>}

      <div className={`topic-list ${viewMode}`}>
        {topics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            readOnly={isReadOnly}
            viewMode={viewMode}
            onDelete={remove}
            onDuplicate={(item) => mutations.duplicateTopic.mutate(item)}
            onToggleFavorite={(item) => mutations.toggleFavorite.mutate(item)}
          />
        ))}
      </div>

      {!isLoading && topics.length === 0 && (
        <div className="panel empty-panel">
          <p className="empty-state">{favoritesOnly ? 'Todavía no hay favoritos.' : 'Todavía no hay temas con estos filtros.'}</p>
        </div>
      )}
    </section>
  );
}
