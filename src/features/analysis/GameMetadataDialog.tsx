import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { AnalysisRecord } from './model';
import { GAME_FIELDS, GameMetadataError, editGameMetadata } from './gameMetadata';
export default function GameMetadataDialog({ record, onSave, onClose }: { record: AnalysisRecord; onSave: (record: AnalysisRecord) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<Record<string, string>>({ ...record.headers, Result: record.headers.Result || '*' });
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const change = (key: string, value: string) => { setError(null); setDraft(current => ({ ...current, [key]: value })); };
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="analysis-workspace-dialog analysis-metadata-dialog">
    <DialogHeader><DialogTitle>Редагувати дані партії</DialogTitle><DialogDescription>Імена, рейтинг і заголовки PGN. Ходи та варіанти зберігаються. Контроль часу, наприклад: 300+2.</DialogDescription></DialogHeader>
    <form ref={formRef} onSubmit={event => {
      event.preventDefault();
      try { onSave(editGameMetadata(record, draft)); onClose(); }
      catch (e) {
        const field = e instanceof GameMetadataError ? e.field : undefined;
        setError({ field, message: e instanceof Error ? e.message : 'Не вдалося зберегти дані.' });
        const input = field && formRef.current?.elements.namedItem(field);
        if (input instanceof HTMLElement) input.focus();
      }
    }}>
      <div className="analysis-metadata-fields">
        <div className="analysis-form-grid">{GAME_FIELDS.map(([key, label]) => <label key={key}>{label}<input name={key} value={draft[key] || ''} maxLength={Math.max(200, record.headers[key]?.length || 0)} aria-invalid={error?.field === key || undefined} aria-describedby={error?.field === key ? 'metadata-error' : key === 'Date' ? 'metadata-date-hint' : undefined} placeholder={key === 'Date' ? '15.09.2026' : undefined} onChange={e => change(key, e.target.value)} /></label>)}
          <label>Результат<select name="Result" value={draft.Result} aria-invalid={error?.field === 'Result' || undefined} aria-describedby={error?.field === 'Result' ? 'metadata-error' : undefined} onChange={e => change('Result', e.target.value)}><option value="*">Не завершено / невідомо</option><option value="1-0">1–0</option><option value="0-1">0–1</option><option value="1/2-1/2">½–½</option>{!['*', '1-0', '0-1', '1/2-1/2'].includes(draft.Result) && <option value={draft.Result}>{draft.Result} (з імпорту)</option>}</select></label>
        </div>
        <p id="metadata-date-hint" className="analysis-muted mt-3">Дата: 15.09.2026, 2026.09.15 або 2026-09-15. Невідому дату можна залишити порожньою.</p>
      </div>
      <div className="analysis-metadata-footer">
        {error && <p id="metadata-error" role="alert">{error.message}</p>}
        <div className="analysis-inline-actions"><Button type="button" variant="outline" onClick={onClose}>Скасувати</Button><Button type="submit">Зберегти дані</Button></div>
      </div>
    </form>
  </DialogContent></Dialog>;
}
