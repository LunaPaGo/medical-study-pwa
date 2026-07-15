import { BookOpen, Clock, Database, Heart, Pill, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../features/topics/topicUtils';
import { useTopicData } from '../features/topics/useTopicData';
import { useSyncQueueCount } from '../features/topics/useSyncQueue';

export function DashboardPage() {
  const { data } = useTopicData();
  const pendingCount = useSyncQueueCount();
  const topics = data?.topics ?? [];
  const recentTopics = [...topics].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 4);
  const favoriteTopics = topics.filter((topic) => topic.is_favorite).slice(0, 4);
  const cards = [
    { label: 'Temas editados', value: String(topics.length), icon: BookOpen },
    { label: 'Favoritos', value: String(favoriteTopics.length), icon: Heart },
    { label: 'Medicamentos', value: '0', icon: Pill },
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
            <h2>Últimos temas editados</h2>
          </div>
          <div className="dashboard-link-list">
            {recentTopics.map((topic) => (
              <Link key={topic.id} to={`/temas/${topic.id}`}>
                <strong>{topic.title}</strong>
                <span>{formatDate(topic.updated_at)}</span>
              </Link>
            ))}
            {recentTopics.length === 0 && <p className="empty-state">Todavía no hay temas creados.</p>}
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
