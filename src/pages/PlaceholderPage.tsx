export function PlaceholderPage({ title, stage }: { title: string; stage: string }) {
  return (
    <section className="page-stack">
      <div className="page-heading">
        <span>{stage}</span>
        <h1>{title}</h1>
        <p>La navegación y la estructura ya están preparadas. Esta funcionalidad se implementará en su etapa correspondiente.</p>
      </div>
      <div className="panel">
        <p className="empty-state">Pendiente de implementación.</p>
      </div>
    </section>
  );
}
