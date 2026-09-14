import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { analysisMatches, deleteAnalysis, hydrateSnapshot, readLibrary, saveAnalysis, shareAnalysis, type SavedAnalysis } from './workspace';
import { type AnalysisRecord } from './model';

export function ArchiveDialog({ record, activeId, onLoad, onSaved, onClose }: { record: AnalysisRecord; activeId: string | null; onLoad: (record: AnalysisRecord, id: string) => void; onSaved: (id: string) => void; onClose: () => void }) {
  const [items, setItems] = useState(readLibrary);
  const current = items.find(item => item.id === activeId);
  const [title, setTitle] = useState(current?.title || [record.headers.White, record.headers.Black].filter(Boolean).join(' — '));
  const [tags, setTags] = useState(current?.tags.join(', ') || '');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const save = (id?: string) => { try { const item = saveAnalysis(record, title, tags.split(','), id); setItems(readLibrary()); onSaved(item.id); setError(''); toast.success('Аналіз збережено.'); } catch (e) { setError(e instanceof Error ? e.message : 'Не вдалося зберегти аналіз.'); } };
  const open = (item: SavedAnalysis) => { try { onLoad(hydrateSnapshot(item.snapshot), item.id); onClose(); } catch { setError('Цей запис пошкоджено. Інші аналізи залишаються доступними.'); } };
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="analysis-workspace-dialog"><DialogHeader><DialogTitle>Мої аналізи</DialogTitle><DialogDescription>Збережені партії на цьому пристрої. Для іншого пристрою скористайтеся посиланням або PGN.</DialogDescription></DialogHeader>
    <div className="analysis-form-grid"><label>Назва<input value={title} maxLength={120} onChange={e => setTitle(e.target.value)} placeholder="Партія або дебютна ідея" /></label><label>Теги через кому<input value={tags} onChange={e => setTags(e.target.value)} placeholder="Сицилійський, турнір, перевірити" /></label></div>
    <div className="analysis-inline-actions"><Button onClick={() => save()}>Зберегти окремо</Button>{current && <Button variant="outline" onClick={() => save(current.id)}>Оновити збережений</Button>}</div>
    {error && <p role="alert">{error}</p>}
    <label>Пошук аналізів<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Суперник, дебют, дата або тег" /></label>
    <div className="analysis-archive-list">{items.filter(item => analysisMatches(item, query)).map(item => <article key={item.id}><button onClick={() => open(item)}><strong>{item.title}</strong><small>{item.tags.join(' · ') || item.snapshot.headers?.Event || 'Без тегів'} · {new Date(item.updatedAt).toLocaleDateString('uk-UA')}</small></button><Button size="sm" variant="ghost" aria-label={`Видалити аналіз ${item.title}`} onClick={() => { try { deleteAnalysis(item.id); setItems(readLibrary()); } catch { setError('Не вдалося видалити запис.'); } }}>Видалити</Button></article>)}{!items.filter(item => analysisMatches(item, query)).length && <p className="analysis-muted">{items.length ? 'Нічого не знайдено.' : 'Збережених аналізів ще немає.'}</p>}</div>
  </DialogContent></Dialog>;
}

export function ShareDialog({ record, onClose }: { record: AnalysisRecord; onClose: () => void }) {
  const [positionOnly, setPositionOnly] = useState(false);
  const [status, setStatus] = useState('');
  let link = '', error = '';
  try { link = shareAnalysis(record, `${window.location.origin}/analysis`, positionOnly); } catch (e) { error = e instanceof Error ? e.message : 'Не вдалося створити посилання.'; }
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="analysis-workspace-dialog"><DialogHeader><DialogTitle>Поділитися аналізом</DialogTitle><DialogDescription>Посилання містить копію партії з коментарями та варіантами. Подальші зміни не змінюють цю копію.</DialogDescription></DialogHeader>
    <label>Що надіслати<select value={positionOnly ? 'position' : 'game'} onChange={e => { setPositionOnly(e.target.value === 'position'); setStatus(''); }}><option value="game">Партія та вибраний хід</option><option value="position">Лише поточна позиція</option></select></label>
    {error ? <p role="alert">{error}</p> : <><label>Посилання<textarea readOnly value={link} onFocus={e => e.target.select()} /></label><Button onClick={async () => { try { await navigator.clipboard.writeText(link); setStatus('Посилання скопійовано'); } catch { setStatus('Виділіть і скопіюйте посилання з поля'); } }}>Копіювати посилання</Button></>}
    <p role="status">{status}</p>
  </DialogContent></Dialog>;
}
