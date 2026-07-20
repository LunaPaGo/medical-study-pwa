import { useEffect, useState } from 'react';
import {
  applyEditorLineSpacing,
  getEditorLineSpacing,
  setEditorLineSpacing,
  type EditorLineSpacing
} from './editorLineSpacing';

export function useEditorLineSpacing() {
  const [lineSpacing, setLineSpacing] = useState<EditorLineSpacing>(() => getEditorLineSpacing());

  useEffect(() => {
    const syncLineSpacing = () => setLineSpacing(getEditorLineSpacing());
    window.addEventListener('askleion-editor-line-spacing-change', syncLineSpacing);
    return () => window.removeEventListener('askleion-editor-line-spacing-change', syncLineSpacing);
  }, []);

  const updateLineSpacing = (nextLineSpacing: EditorLineSpacing) => {
    setEditorLineSpacing(nextLineSpacing);
    setLineSpacing(applyEditorLineSpacing(nextLineSpacing));
  };

  return { lineSpacing, setEditorLineSpacing: updateLineSpacing };
}
