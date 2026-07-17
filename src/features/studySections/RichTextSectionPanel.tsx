import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { AttachmentOwnerType } from '../../types/attachment';
import type { TipTapDocument } from '../../types/topic';
import { isEmptyTipTapDocument } from '../topics/tiptapDocument';
import { RichTextEditor } from '../topics/RichTextEditor';
import { TopicContentViewer } from '../topics/TopicContentViewer';

type Props = {
  storageKey: string;
  sectionKey: string;
  title: string;
  value: TipTapDocument;
  mode: 'edit' | 'read';
  owner?: { ownerType: AttachmentOwnerType; ownerId: string };
  onChange?: (value: { json: TipTapDocument; html: string }) => void;
  children?: ReactNode;
};

function readOpenState(storageKey: string, sectionKey: string) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    return Boolean(parsed[sectionKey]);
  } catch {
    return false;
  }
}

function writeOpenState(storageKey: string, sectionKey: string, open: boolean) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    localStorage.setItem(storageKey, JSON.stringify({ ...parsed, [sectionKey]: open }));
  } catch {
    // Visual state is optional and must never block editing.
  }
}

export function RichTextSectionPanel({ storageKey, sectionKey, title, value, mode, owner, onChange, children }: Props) {
  const [open, setOpen] = useState(() => readOpenState(storageKey, sectionKey));
  const [wasOpened, setWasOpened] = useState(open);
  const hasContent = useMemo(() => !isEmptyTipTapDocument(value), [value]);

  useEffect(() => {
    writeOpenState(storageKey, sectionKey, open);
    if (open) setWasOpened(true);
  }, [open, sectionKey, storageKey]);

  return (
    <section className={`panel rich-section-panel ${open ? 'open' : ''}`}>
      <button className="rich-section-summary" type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <span className={`section-content-dot ${hasContent ? 'filled' : ''}`} aria-hidden="true" />
        <strong>{title}</strong>
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      {open && (
        <div className="rich-section-body">
          {children}
          {mode === 'edit'
            ? wasOpened && <RichTextEditor value={value} owner={owner} onChange={onChange ?? (() => undefined)} />
            : hasContent && <TopicContentViewer content={value} />}
        </div>
      )}
    </section>
  );
}
