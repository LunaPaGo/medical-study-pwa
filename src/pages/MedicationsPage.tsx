import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitCompare, Grid2X2, List, Pill, Search } from 'lucide-react';
import { PrimaryActionButton } from '../components/ui/PrimaryActionButton';
import { MedicationCard } from '../features/medications/MedicationCard';
import { filterMedications } from '../features/medications/medicationRepository';
import { useMedicationData, useMedicationMutations } from '../features/medications/useMedicationData';
import { useStudyListViewPreference } from '../features/theme/useStudyListViewPreference';
import { useAuth } from '../hooks/useAuth';
import type { MedicationSort, MedicationWithRelations } from '../types/medication';

export function MedicationsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useMedicationData();
  const mutations = useMedicationMutations();
  const { isReadOnly } = useAuth();
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [administration, setAdministration] = useState('');
  const [tagId, setTagId] = useState('');
  const [status, setStatus] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [sort, setSort] = useState<MedicationSort>('updated_desc');
  const { viewMode, setViewMode } = useStudyListViewPreference();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const groups = useMemo(
    () =>
      Array.from(new Set((data?.medications ?? []).map((medication) => medication.pharmacologic_group).filter(Boolean) as string[])).sort(
        (a, b) => a.localeCompare(b, 'es')
      ),
    [data?.medications]
  );

  const medications = useMemo(
    () =>
      filterMedications(data?.medications ?? [], {
        search,
        group,
        administration,
        tagId,
        status: status as '' | 'draft' | 'complete',
        favoriteOnly,
        sort
      }),
    [administration, data?.medications, favoriteOnly, group, search, sort, status, tagId]
  );

  const toggleSelected = (medication: MedicationWithRelations, checked: boolean) => {
    setSelectedIds((current) => {
      if (!checked) return current.filter((id) => id !== medication.id);
      if (current.includes(medication.id)) return current;
      return [...current, medication.id].slice(-2);
    });
  };

  const compare = () => {
    if (selectedIds.length !== 2) {
      window.alert('Seleccioná exactamente dos medicamentos para comparar.');
      return;
    }
    navigate(`/farmacologia/comparar?left=${selectedIds[0]}&right=${selectedIds[1]}`);
  };

  const remove = (medication: MedicationWithRelations) => {
    const name = medication.generic_name || 'este medicamento';
    if (window.confirm(`¿Eliminar "${name}"? Esta acción también se sincronizará con Supabase.`)) {
      mutations.deleteMedication.mutate(medication.id);
    }
  };

  return (
    <section className="page-stack">
      <div className="page-heading page-heading-actions">
        <div>
          <span>Etapa 4</span>
          <h1>Farmacología</h1>
          <p>Fichas de medicamentos para estudiar, consultar rápido, adjuntar archivos y comparar fármacos.</p>
        </div>
        <div className="heading-actions medication-heading-actions">
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
          <button className="ghost-button" type="button" onClick={compare}>
            <GitCompare size={18} />
            Comparar
          </button>
          {isReadOnly ? (
            <span className="notice warning readonly-inline">Modo sin conexión: solo lectura.</span>
          ) : (
            <PrimaryActionButton aria-label="Nuevo medicamento" icon={<Pill />} iconOnlyOnMobile to="/farmacologia/nuevo">
              Nuevo
            </PrimaryActionButton>
          )}
        </div>
      </div>

      <section className="panel filter-panel medication-filter-panel">
        <Search size={20} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, grupo, mecanismo, indicaciones, dosis o seguridad" />
        <select value={group} onChange={(event) => setGroup(event.target.value)}>
          <option value="">Todos los grupos</option>
          {groups.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input value={administration} onChange={(event) => setAdministration(event.target.value)} placeholder="Vía o administración" />
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
        <select value={sort} onChange={(event) => setSort(event.target.value as MedicationSort)}>
          <option value="updated_desc">Modificación reciente</option>
          <option value="generic_name_asc">Nombre alfabético</option>
          <option value="created_desc">Creación reciente</option>
          <option value="favorite_desc">Favoritos primero</option>
        </select>
        <label className="checkbox-label">
          <input checked={favoriteOnly} type="checkbox" onChange={(event) => setFavoriteOnly(event.target.checked)} />
          Favoritos
        </label>
      </section>

      <div className="notice warning">Seleccionados para comparar: {selectedIds.length}/2</div>

      {isLoading && <div className="panel empty-state">Cargando medicamentos...</div>}

      <div className={`medication-list ${viewMode}`}>
        {medications.map((medication) => (
          <MedicationCard
            key={medication.id}
            medication={medication}
            selected={selectedIds.includes(medication.id)}
            readOnly={isReadOnly}
            viewMode={viewMode}
            onSelect={toggleSelected}
            onDelete={remove}
            onDuplicate={(item) => mutations.duplicateMedication.mutate(item)}
            onToggleFavorite={(item) => mutations.toggleFavorite.mutate(item)}
          />
        ))}
      </div>

      {!isLoading && medications.length === 0 && <div className="panel empty-state">Todavía no hay medicamentos con estos filtros.</div>}
    </section>
  );
}
