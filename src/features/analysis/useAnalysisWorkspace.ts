import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import { type AnalysisRecord } from './model';
import { saveDraft, withHistory } from './workspace';

export function useAnalysisWorkspace(initial: () => AnalysisRecord) {
  const [record, setRecord] = useState(initial);
  const [saveStatus, setSaveStatus] = useState('');
  const latest = useRef(record); latest.current = record;
  const editRecord = useCallback((action: SetStateAction<AnalysisRecord>) => setRecord(current => withHistory(current, typeof action === 'function' ? action(current) : action)), []);
  useEffect(() => {
    setSaveStatus('Зберігаємо…');
    const timer = window.setTimeout(() => {
      try { saveDraft(record); setSaveStatus('Збережено на цьому пристрої'); }
      catch { setSaveStatus('Не збережено: перевірте місце або експортуйте PGN'); }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [record]);
  useEffect(() => {
    const flush = () => { try { saveDraft(latest.current); } catch { /* The visible status and PGN export remain available. */ } };
    window.addEventListener('pagehide', flush);
    return () => { window.removeEventListener('pagehide', flush); flush(); };
  }, []);
  return { record, setRecord, editRecord, saveStatus };
}
