import { TopicContentViewer } from '../topics/TopicContentViewer';
import type { TipTapDocument } from '../../types/topic';

export function MedicationRichViewer({ content }: { content: TipTapDocument }) {
  return <TopicContentViewer content={content} />;
}
