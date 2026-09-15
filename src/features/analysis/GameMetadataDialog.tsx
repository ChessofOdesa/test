import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { AnalysisRecord } from './model';
import { GAME_FIELDS, editGameMetadata } from './gameMetadata';
export default function GameMetadataDialog({ record, onSave, onClose }: { record: AnalysisRecord; onSave: (record: AnalysisRecord) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<Record<string, string>>({ ...record.headers, Result: record.headers.Result || '*' });
  const [error, setError] = useState('');
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="analysis-workspace-dialog">
    <DialogHeader><DialogTitle>Редагувати дані партії</DialogTitle><DialogDescription>Імена, рейтинг і заголовки PGN. Ходи та варіанти зберігаються. Контроль часу, наприклад: 300+2.</DialogDescription></DialogHeader>
    <form onSubmit={event => { event.preventDefault(); try { onSave(editGameMetadata(record, draft)); onClose(); } catch (e) { setError(e instanceof Error ? e.message : 'Не вдалося зберегти дані.'); } }}>
      <div className="analysis-form-grid">{GAME_FIELDS.map(([key, label]) => <label key={key}>{label}<input value={draft[key] || ''} maxLength={200} placeholder={key === 'Date' ? '2026.09.15' : undefined} onChange={e => { setError(''); setDraft(value => ({ ...value, [key]: e.target.value })); }} /></label>)}
        <label>Результат<select value={draft.Result} onChange={e => setDraft(value => ({ ...value, Result: e.target.value }))}><option value="*">Не завершено / невідомо</option><option value="1-0">1–0</option><option value="0-1">0–1</option><option value="1/2-1/2">½–½</option></select></label>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="analysis-inline-actions mt-4"><Button type="button" variant="outline" onClick={onClose}>Скасувати</Button><Button type="submit">Зберегти дані</Button></div>
    </form>
  </DialogContent></Dialog>;
}
