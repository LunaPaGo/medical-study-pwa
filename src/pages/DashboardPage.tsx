import { BookOpen, Clock, Database, Heart, Pill, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRecentLibraryItems } from '../features/dashboard/recentLibraryItems';
import { useMedicationData } from '../features/medications/useMedicationData';
import { useProcedureData } from '../features/procedures/useProcedureData';
import { formatDate } from '../features/topics/topicUtils';
import { useTopicData } from '../features/topics/useTopicData';
import { useSyncQueueCount } from '../features/topics/useSyncQueue';

export function DashboardPage() {
  const { data } = useTopicData();
  const { data: medicationData } = useMedicationData();
  const { data: procedureData } = useProcedureData();
  const pendingCount = useSyncQueueCount();
  const topics = data?.topics ?? [];
  const medications = medicationData?.medications ?? [];
  const procedures = procedureData?.procedures ?? [];
  const recentItems = getRecentLibraryItems(topics, medications, procedures, 5);
  const favoriteTopics = topics.filter((topic) => topic.is_favorite).slice(0, 4);
  const cards = [
    { label: 'Temas editados', value: String(topics.length), icon: BookOpen },
    { label: 'Favoritos', value: String(favoriteTopics.length), icon: Heart },
    { label: 'Medicamentos', value: String(medications.length), icon: Pill },
    { label: 'Pendientes de sync', value: String(pendingCount), icon: RefreshCcw }
  ];

  return (
    <section className="page-stack">
      <div className="page-heading">
        <span>Inicio</span>
        <h1>Panel de estudio</h1>
        <p>Base técnica lista para autenticar, instalar como PWA y conectar con Supabase.</p>
      </div>

      <div className="stats-grid">
        {cards.map((card) => (
          <article className="stat-card" key={card.label}>
            <card.icon size={22} aria-hidden="true" />
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-title">
            <Clock size={20} aria-hidden="true" />
            <h2>Últimos elementos editados</h2>
          </div>
          <div className="dashboard-link-list">
            {recentItems.map((item) => (
              <Link key={`${item.type}-${item.id}`} to={item.route}>
                <div className="dashboard-recent-title">
                  <strong>{item.title}</strong>
                  <span className={`status-pill recent-type-pill ${item.type}`}>{item.typeLabel}</span>
                </div>
                {item.subtitle && <span>{item.subtitle}</span>}
                <span>Modificado {formatDate(item.updatedAt)}</span>
              </Link>
            ))}
            {recentItems.length === 0 && <p className="empty-state">Todavía no hay contenido creado.</p>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <Database size={20} aria-hidden="true" />
            <h2>Estado de datos</h2>
          </div>
          <div className="dashboard-link-list">
            {favoriteTopics.map((topic) => (
              <Link key={topic.id} to={`/temas/${topic.id}`}>
                <strong>{topic.title}</strong>
                <span>Favorito</span>
              </Link>
            ))}
            {favoriteTopics.length === 0 && <p className="empty-state">Sin favoritos todavía.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}
