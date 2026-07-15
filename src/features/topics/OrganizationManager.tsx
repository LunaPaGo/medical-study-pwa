import { FormEvent, useState } from 'react';
import { Edit3, Plus, Trash2, X } from 'lucide-react';
import type { Folder, OrganizationKind, TopicWithRelations } from '../../types/topic';
import { organizationSchema } from '../../validation/topic';
import { useTopicMutations } from './useTopicData';

type Props = {
  kind: OrganizationKind;
  title: string;
  items: Folder[];
  topics: TopicWithRelations[];
};

function isItemUsed(kind: OrganizationKind, id: string, topics: TopicWithRelations[]) {
  if (kind === 'folders') return topics.some((topic) => topic.folder_id === id);
  if (kind === 'categories') return topics.some((topic) => topic.category_id === id);
  return topics.some((topic) => topic.tags.some((tag) => tag.id === id));
}

export function OrganizationManager({ kind, title, items, topics }: Props) {
  const mutations = useTopicMutations();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#0f766e');
  const [editing, setEditing] = useState<Folder | null>(null);
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setColor('#0f766e');
    setEditing(null);
    setError('');
  };

  const startEdit = (item: Folder) => {
    setEditing(item);
    setName(item.name);
    setColor(item.color ?? '#0f766e');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = organizationSchema.safeParse({ name, color });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos.');
      return;
    }

    mutations.saveOrganizationItem.mutate(
      { kind, values: parsed.data, existing: editing ?? undefined },
      { onSuccess: reset }
    );
  };

  const remove = (item: Folder) => {
    const used = isItemUsed(kind, item.id, topics);
    const message = used
      ? `"${item.name}" tiene temas asociados. Si lo eliminás, esos temas conservarán el dato local hasta que los edites. ¿Querés continuar?`
      : `¿Eliminar "${item.name}"?`;

    if (!window.confirm(message)) return;
    mutations.deleteOrganizationItem.mutate({ kind, id: item.id });
  };

  return (
    <section className="panel organization-panel">
      <div className="panel-title">
        <h2>{title}</h2>
      </div>
      <form className="inline-form" onSubmit={handleSubmit}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre" />
        <input className="color-input" value={color} onChange={(event) => setColor(event.target.value)} type="color" />
        <button className="primary-button" type="submit">
          <Plus size={17} />
          {editing ? 'Guardar' : 'Crear'}
        </button>
        {editing && (
          <button className="ghost-button icon-button" type="button" onClick={reset} title="Cancelar edición">
            <X size={17} />
          </button>
        )}
      </form>
      {error && <div className="notice error">{error}</div>}
      <div className="chip-list">
        {items.map((item) => (
          <span className="editable-chip" key={item.id}>
            <span className="chip-color" style={{ background: item.color ?? '#0f766e' }} />
            {item.name}
            <button type="button" title="Editar" onClick={() => startEdit(item)}>
              <Edit3 size={15} />
            </button>
            <button type="button" title="Eliminar" onClick={() => remove(item)}>
              <Trash2 size={15} />
            </button>
          </span>
        ))}
        {items.length === 0 && <p className="empty-state">Todavía no hay elementos.</p>}
      </div>
    </section>
  );
}
