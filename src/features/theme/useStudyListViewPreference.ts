import { useEffect, useState } from 'react';

export type StudyListViewMode = 'list' | 'grid';

const studyListViewStorageKey = 'askleion-study-list-view';

function isStudyListViewMode(value: string | null): value is StudyListViewMode {
  return value === 'list' || value === 'grid';
}

export function getStudyListViewPreference(): StudyListViewMode {
  const stored = localStorage.getItem(studyListViewStorageKey);
  return isStudyListViewMode(stored) ? stored : 'list';
}

export function setStudyListViewPreference(viewMode: StudyListViewMode) {
  localStorage.setItem(studyListViewStorageKey, viewMode);
  window.dispatchEvent(new CustomEvent('askleion-study-list-view-change', { detail: { viewMode } }));
}

export function useStudyListViewPreference() {
  const [viewMode, setViewMode] = useState<StudyListViewMode>(() => getStudyListViewPreference());

  useEffect(() => {
    const syncViewMode = () => setViewMode(getStudyListViewPreference());
    window.addEventListener('askleion-study-list-view-change', syncViewMode);
    window.addEventListener('storage', syncViewMode);
    return () => {
      window.removeEventListener('askleion-study-list-view-change', syncViewMode);
      window.removeEventListener('storage', syncViewMode);
    };
  }, []);

  const updateViewMode = (nextViewMode: StudyListViewMode) => {
    setStudyListViewPreference(nextViewMode);
    setViewMode(nextViewMode);
  };

  return { viewMode, setViewMode: updateViewMode };
}
