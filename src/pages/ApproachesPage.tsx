import { FilePlus2, GitBranch, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PrimaryActionButton } from '../components/ui/PrimaryActionButton';
import { ABDOMINAL_PAIN_APPROACH_TITLE, createAbdominalPainClinicalApproach } from '../features/approaches/abdominalPainApproachFixture';
import { CHEST_PAIN_APPROACH_TITLE, createChestPainClinicalApproach } from '../features/approaches/chestPainApproachFixture';
import { createDyspneaClinicalApproach, DYSPNEA_APPROACH_TITLE } from '../features/approaches/dyspneaApproachFixture';
import { createHeadacheClinicalApproach, HEADACHE_APPROACH_TITLE } from '../features/approaches/headacheApproachFixture';
import { createFeverClinicalApproach, FEVER_APPROACH_TITLE } from '../features/approaches/feverApproachFixture';
import { useClinicalApproaches, useClinicalApproachMutations } from '../features/approaches/useClinicalApproaches';
import { useAuth } from '../hooks/useAuth';

export function ApproachesPage() {
  const polytraumaFixtureTitle = 'Politrauma';
  const sepsisFixtureTitle = 'Sepsis';
  const shockFixtureTitle = 'Shock';
  const alteredMentalStatusFixtureTitle = 'Alteración aguda del sensorio';
  const seizureStatusFixtureTitle = 'Convulsión y status epiléptico';
  const { data: approaches = [], isLoading, error } = useClinicalApproaches();
  const { user } = useAuth();
  const navigate = useNavigate();
  const mutations = useClinicalApproachMutations();
  const [fixtureError, setFixtureError] = useState('');
  const hasChestPainFixture = approaches.some((approach) => approach.title.trim().toLocaleLowerCase('es') === CHEST_PAIN_APPROACH_TITLE.toLocaleLowerCase('es'));
  const hasAbdominalPainFixture = approaches.some((approach) => approach.title.trim().toLocaleLowerCase('es') === ABDOMINAL_PAIN_APPROACH_TITLE.toLocaleLowerCase('es'));
  const hasDyspneaFixture = approaches.some((approach) => approach.title.trim().toLocaleLowerCase('es') === DYSPNEA_APPROACH_TITLE.toLocaleLowerCase('es'));
  const hasHeadacheFixture = approaches.some((approach) => approach.title.trim().toLocaleLowerCase('es') === HEADACHE_APPROACH_TITLE.toLocaleLowerCase('es'));
  const hasFeverFixture = approaches.some((approach) => approach.title.trim().toLocaleLowerCase('es') === FEVER_APPROACH_TITLE.toLocaleLowerCase('es'));
  const hasSepsisFixture = approaches.some((approach) => approach.title.trim().toLocaleLowerCase('es') === sepsisFixtureTitle.toLocaleLowerCase('es'));
  const hasShockFixture = approaches.some((approach) => approach.title.trim().toLocaleLowerCase('es') === shockFixtureTitle.toLocaleLowerCase('es'));
  const hasPolytraumaFixture = approaches.some((approach) => approach.title.trim().toLocaleLowerCase('es') === polytraumaFixtureTitle.toLocaleLowerCase('es'));
  const hasAlteredMentalStatusFixture = approaches.some((approach) => approach.title.trim().toLocaleLowerCase('es') === alteredMentalStatusFixtureTitle.toLocaleLowerCase('es'));
  const hasSeizureStatusFixture = approaches.some((approach) => approach.title.trim().toLocaleLowerCase('es') === seizureStatusFixtureTitle.toLocaleLowerCase('es'));
  const loadChestPainFixture = async () => {
    if (!user?.id || hasChestPainFixture) return;
    setFixtureError('');
    try {
      const saved = await mutations.save.mutateAsync(createChestPainClinicalApproach(user.id));
      navigate(`/abordajes/${saved.id}`);
    } catch (loadError) {
      setFixtureError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el ejemplo en este dispositivo.');
    }
  };
  const loadAbdominalPainFixture = async () => {
    if (!user?.id || hasAbdominalPainFixture) return;
    setFixtureError('');
    try {
      const saved = await mutations.save.mutateAsync(createAbdominalPainClinicalApproach(user.id));
      navigate(`/abordajes/${saved.id}`);
    } catch (loadError) {
      setFixtureError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el ejemplo en este dispositivo.');
    }
  };
  const loadDyspneaFixture = async () => {
    if (!user?.id || hasDyspneaFixture) return;
    setFixtureError('');
    try {
      const saved = await mutations.save.mutateAsync(createDyspneaClinicalApproach(user.id));
      navigate(`/abordajes/${saved.id}`);
    } catch (loadError) {
      setFixtureError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el ejemplo en este dispositivo.');
    }
  };
  const loadHeadacheFixture = async () => {
    if (!user?.id || hasHeadacheFixture) return;
    setFixtureError('');
    try {
      const saved = await mutations.save.mutateAsync(createHeadacheClinicalApproach(user.id));
      navigate(`/abordajes/${saved.id}`);
    } catch (loadError) {
      setFixtureError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el ejemplo en este dispositivo.');
    }
  };
  const loadFeverFixture = async () => {
    if (!user?.id || hasFeverFixture) return;
    setFixtureError('');
    try {
      const saved = await mutations.save.mutateAsync(createFeverClinicalApproach(user.id));
      navigate(`/abordajes/${saved.id}`);
    } catch (loadError) {
      setFixtureError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el ejemplo en este dispositivo.');
    }
  };
  const loadSepsisFixture = async () => {
    if (!user?.id || hasSepsisFixture) return;
    setFixtureError('');
    try {
      const { createSepsisClinicalApproach } = await import('../features/approaches/sepsisApproachFixture');
      const saved = await mutations.save.mutateAsync(createSepsisClinicalApproach(user.id));
      navigate(`/abordajes/${saved.id}`);
    } catch (loadError) {
      setFixtureError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el ejemplo en este dispositivo.');
    }
  };
  const loadShockFixture = async () => {
    if (!user?.id || hasShockFixture) return;
    setFixtureError('');
    try {
      const { createShockClinicalApproach } = await import('../features/approaches/shockApproachFixture');
      const saved = await mutations.save.mutateAsync(createShockClinicalApproach(user.id));
      navigate(`/abordajes/${saved.id}`);
    } catch (loadError) {
      setFixtureError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el ejemplo en este dispositivo.');
    }
  };
  const loadPolytraumaFixture = async () => {
    if (!user?.id || hasPolytraumaFixture) return;
    setFixtureError('');
    try {
      const { createPolytraumaClinicalApproach } = await import('../features/approaches/polytraumaApproachFixture');
      const saved = await mutations.save.mutateAsync(createPolytraumaClinicalApproach(user.id));
      navigate(`/abordajes/${saved.id}`);
    } catch (loadError) {
      setFixtureError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el ejemplo en este dispositivo.');
    }
  };
  const loadAlteredMentalStatusFixture = async () => {
    if (!user?.id || hasAlteredMentalStatusFixture) return;
    setFixtureError('');
    try {
      const { createAlteredMentalStatusClinicalApproach } = await import('../features/approaches/alteredMentalStatusApproachFixture');
      const saved = await mutations.save.mutateAsync(createAlteredMentalStatusClinicalApproach(user.id));
      navigate(`/abordajes/${saved.id}`);
    } catch (loadError) {
      setFixtureError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el ejemplo en este dispositivo.');
    }
  };
  const loadSeizureStatusFixture = async () => {
    if (!user?.id || hasSeizureStatusFixture) return;
    setFixtureError('');
    try {
      const { createSeizureStatusClinicalApproach } = await import('../features/approaches/seizureStatusApproachFixture');
      const saved = await mutations.save.mutateAsync(createSeizureStatusClinicalApproach(user.id));
      navigate(`/abordajes/${saved.id}`);
    } catch (loadError) {
      setFixtureError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el ejemplo en este dispositivo.');
    }
  };
  const remove = (id: string, title: string) => {
    if (window.confirm(`¿Eliminar localmente "${title}"?`)) mutations.remove.mutate(id);
  };

  return <section className="page-stack">
    <div className="page-heading page-heading-actions"><div><span>Razonamiento orientado por problema</span><h1>Abordajes</h1><p>Organizá la evaluación clínica desde la presentación inicial, antes de conocer el diagnóstico.</p></div><div className="approach-page-actions">{!isLoading && !hasChestPainFixture && <button className="secondary-button" type="button" disabled={!user?.id || mutations.save.isPending} onClick={() => void loadChestPainFixture()}><FilePlus2 size={18} />{mutations.save.isPending ? 'Cargando ejemplo...' : 'Cargar ejemplo: Dolor torácico'}</button>}{!isLoading && !hasAbdominalPainFixture && <button className="secondary-button" type="button" disabled={!user?.id || mutations.save.isPending} onClick={() => void loadAbdominalPainFixture()}><FilePlus2 size={18} />{mutations.save.isPending ? 'Cargando ejemplo...' : 'Cargar ejemplo: Dolor abdominal'}</button>}{!isLoading && !hasDyspneaFixture && <button className="secondary-button" type="button" disabled={!user?.id || mutations.save.isPending} onClick={() => void loadDyspneaFixture()}><FilePlus2 size={18} />{mutations.save.isPending ? 'Cargando ejemplo...' : 'Cargar ejemplo: Disnea'}</button>}{!isLoading && !hasHeadacheFixture && <button className="secondary-button" type="button" disabled={!user?.id || mutations.save.isPending} onClick={() => void loadHeadacheFixture()}><FilePlus2 size={18} />{mutations.save.isPending ? 'Cargando ejemplo...' : 'Cargar ejemplo: Cefalea'}</button>}{!isLoading && !hasFeverFixture && <button className="secondary-button" type="button" disabled={!user?.id || mutations.save.isPending} onClick={() => void loadFeverFixture()}><FilePlus2 size={18} />{mutations.save.isPending ? 'Cargando ejemplo...' : 'Cargar ejemplo: Fiebre'}</button>}{!isLoading && !hasSepsisFixture && <button className="secondary-button" type="button" disabled={!user?.id || mutations.save.isPending} onClick={() => void loadSepsisFixture()}><FilePlus2 size={18} />{mutations.save.isPending ? 'Cargando ejemplo...' : 'Cargar ejemplo: Sepsis'}</button>}{!isLoading && !hasShockFixture && <button className="secondary-button" type="button" disabled={!user?.id || mutations.save.isPending} onClick={() => void loadShockFixture()}><FilePlus2 size={18} />{mutations.save.isPending ? 'Cargando ejemplo...' : 'Cargar ejemplo: Shock'}</button>}{!isLoading && !hasPolytraumaFixture && <button className="secondary-button" type="button" disabled={!user?.id || mutations.save.isPending} onClick={() => void loadPolytraumaFixture()}><FilePlus2 size={18} />{mutations.save.isPending ? 'Cargando ejemplo...' : 'Cargar ejemplo: Politrauma'}</button>}{!isLoading && !hasAlteredMentalStatusFixture && <button className="secondary-button" type="button" disabled={!user?.id || mutations.save.isPending} onClick={() => void loadAlteredMentalStatusFixture()}><FilePlus2 size={18} />{mutations.save.isPending ? 'Cargando ejemplo...' : 'Cargar ejemplo: Alteración aguda del sensorio'}</button>}{!isLoading && !hasSeizureStatusFixture && <button className="secondary-button" type="button" disabled={!user?.id || mutations.save.isPending} onClick={() => void loadSeizureStatusFixture()}><FilePlus2 size={18} />{mutations.save.isPending ? 'Cargando ejemplo...' : 'Cargar ejemplo: Convulsión y status epiléptico'}</button>}<PrimaryActionButton to="/abordajes/nuevo" icon={<Plus />} iconOnlyOnMobile>Nuevo</PrimaryActionButton></div></div>
    {isLoading && <div className="panel empty-state">Cargando abordajes locales...</div>}
    {error && <div className="notice error">No se pudieron leer los abordajes de este usuario. {error.message}</div>}
    {fixtureError && <div className="notice error">{fixtureError}</div>}
    <div className="approach-list">{approaches.map((approach) => <article className="approach-card" key={approach.id}><div><span className={`status-pill ${approach.status}`}>{approach.status === 'complete' ? 'Completo' : 'Borrador'}</span><GitBranch size={20} aria-hidden="true" /></div><h2>{approach.title}</h2><p>{approach.description || 'Sin descripción.'}</p>{approach.category && <div className="chip-list"><span className="tag-chip">{approach.category.name}</span></div>}<div className="card-actions"><Link className="ghost-button" to={`/abordajes/${approach.id}`}>Ver</Link><Link className="ghost-button" to={`/abordajes/${approach.id}/editar`}>Editar</Link><button className="ghost-button danger-action" type="button" disabled={mutations.remove.isPending} onClick={() => remove(approach.id, approach.title)}><Trash2 size={16} />Eliminar local</button></div></article>)}</div>
    {!isLoading && !error && approaches.length === 0 && <div className="panel empty-state">Todavía no hay abordajes guardados en este dispositivo.</div>}
  </section>;
}
