export type EditorLineSpacing = 'compact' | 'normal' | 'wide';

export const editorLineSpacingStorageKey = 'askleion-editor-line-spacing';

export function isEditorLineSpacing(value: unknown): value is EditorLineSpacing {
  return value === 'compact' || value === 'normal' || value === 'wide';
}

export function getEditorLineSpacing(): EditorLineSpacing {
  const stored = localStorage.getItem(editorLineSpacingStorageKey);
  return isEditorLineSpacing(stored) ? stored : 'normal';
}

export function applyEditorLineSpacing(lineSpacing: EditorLineSpacing = getEditorLineSpacing()) {
  document.documentElement.dataset.editorLineSpacing = lineSpacing;
  return lineSpacing;
}

export function setEditorLineSpacing(lineSpacing: EditorLineSpacing) {
  localStorage.setItem(editorLineSpacingStorageKey, lineSpacing);
  applyEditorLineSpacing(lineSpacing);
  window.dispatchEvent(new CustomEvent('askleion-editor-line-spacing-change', { detail: { lineSpacing } }));
}

export function initializeEditorLineSpacing() {
  applyEditorLineSpacing();

  window.addEventListener('storage', (event) => {
    if (event.key === editorLineSpacingStorageKey) {
      const lineSpacing = isEditorLineSpacing(event.newValue) ? event.newValue : 'normal';
      applyEditorLineSpacing(lineSpacing);
      window.dispatchEvent(new CustomEvent('askleion-editor-line-spacing-change', { detail: { lineSpacing } }));
    }
  });
}
