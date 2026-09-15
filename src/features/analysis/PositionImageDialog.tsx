import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { downloadImageBlob, positionSvg, svgToPng, type PositionImageOptions } from './positionImage';
import { toggleArrow } from './annotations';
import type { AnalysisArrow } from './model';
export default function PositionImageDialog({ source, onClose }: { source: PositionImageOptions; onClose: () => void }) {
  const [options, setOptions] = useState(source);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [from, setFrom] = useState(''), [to, setTo] = useState('');
  const preview = useMemo(() => { try { return { svg: positionSvg(options), error: '' }; } catch (e) { return { svg: '', error: (e as Error).message }; } }, [options]);
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="analysis-workspace-dialog">
    <DialogHeader><DialogTitle>Експорт позиції картинкою</DialogTitle><DialogDescription>Поточна позиція, орієнтація дошки, стрілки та підпис. Зміни у цьому вікні стосуються лише картинки.</DialogDescription></DialogHeader>
    <div className="analysis-inline-actions">{([['showLastMove', 'Останній хід'], ['showArrows', 'Стрілки'], ['showComment', 'Коментар']] as const).map(([key, label]) => <label key={key}><input type="checkbox" checked={options[key]} onChange={e => setOptions(value => ({ ...value, [key]: e.target.checked }))} />{label}</label>)}</div>
    <label>Підпис картинки<textarea value={options.comment} maxLength={2000} onChange={e => setOptions(value => ({ ...value, comment: e.target.value }))} /></label>
    <details><summary>Додати або прибрати стрілку</summary><form className="analysis-inline-actions" onSubmit={event => { event.preventDefault(); if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to) || from === to) { setError('Вкажіть різні поля, наприклад e2 та e4.'); return; } setOptions(value => ({ ...value, showArrows: true, arrows: toggleArrow(value.arrows, from as AnalysisArrow[0], to as AnalysisArrow[1]) })); setError(''); }}>
      <label>З поля<input value={from} maxLength={2} onChange={e => setFrom(e.target.value.toLowerCase())} placeholder="e2" /></label><label>На поле<input value={to} maxLength={2} onChange={e => setTo(e.target.value.toLowerCase())} placeholder="e4" /></label><Button type="submit" variant="outline">Змінити стрілку</Button>
    </form></details>
    {preview.svg && <img className="analysis-position-image" alt="Попередній перегляд позиції для експорту" src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(preview.svg)} />}
    {(error || preview.error) && <p role="alert">{error || preview.error}</p>}
    <div className="analysis-inline-actions"><Button disabled={busy || !preview.svg} onClick={async () => { setBusy(true); setError(''); try { downloadImageBlob(await svgToPng(preview.svg), 'chess-of-odesa-position.png'); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>{busy ? 'Готуємо PNG…' : 'Завантажити PNG'}</Button>
    <Button variant="outline" disabled={!preview.svg} onClick={() => downloadImageBlob(new Blob([preview.svg], { type: 'image/svg+xml;charset=utf-8' }), 'chess-of-odesa-position.svg')}>Завантажити SVG</Button></div>
  </DialogContent></Dialog>;
}
