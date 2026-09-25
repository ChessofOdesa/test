import { useState } from 'react';
import { Check, Layers, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { THEME_IDEAS } from './review';

export function ThemePicker({ themes, selected, count, disabled, open, onOpenChange, onChange }: {
    themes: string[]; selected: string[]; count: number; disabled: boolean; open: boolean;
    onOpenChange: (open: boolean) => void; onChange: (themes: string[]) => void;
}) {
    const [draft, setDraft] = useState(selected), [query, setQuery] = useState('');
    const changeOpen = (next: boolean) => { if (next) { setDraft(selected); setQuery(''); } onOpenChange(next); };
    const filtered = themes.filter(theme => theme.toLocaleLowerCase('uk').includes(query.trim().toLocaleLowerCase('uk')));
    return <section className="puzzle-theme-picker">
        <h2>Тема</h2>
        <div className="puzzle-theme-chips">{selected.length ? selected.map(theme => <button type="button" key={theme} disabled={disabled} aria-label={`Прибрати тему ${theme}`} onClick={() => onChange(selected.filter(t => t !== theme))}>{theme}<X size={14} /></button>) : <span>Змішані задачі</span>}</div>
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild><Button variant="outline" className="puzzle-theme-button" aria-label="Вибрати тему задач" disabled={disabled}>Змінити теми</Button></DialogTrigger>
            <DialogContent closeLabel="Закрити" className="puzzle-theme-dialog">
                <DialogHeader><DialogTitle>Теми задач</DialogTitle><DialogDescription>{count.toLocaleString('uk-UA')} задач · {themes.length} тем</DialogDescription></DialogHeader>
                <label className="puzzle-theme-search"><Search size={18} /><input aria-label="Пошук теми" placeholder="Пошук теми…" value={query} onChange={e => setQuery(e.target.value)} /></label>
                <button type="button" className="puzzle-theme-all" aria-label="Змішані задачі" aria-pressed={!draft.length} onClick={() => setDraft([])}><Layers size={22} /><span>Змішані задачі<small>Усі теми</small></span>{!draft.length && <Check size={20} />}</button>
                <div className="puzzle-theme-grid" role="group" aria-label="Теми задач">{filtered.map(theme => <button type="button" key={theme} aria-label={theme} aria-pressed={draft.includes(theme)} onClick={() => setDraft(draft.includes(theme) ? draft.filter(t => t !== theme) : [...draft, theme])}><span className="puzzle-theme-check">{draft.includes(theme) && <Check size={16} />}</span><span>{theme}<small>{THEME_IDEAS[theme]}</small></span></button>)}{!filtered.length && <p role="status">Тем не знайдено. Спробуй іншу назву.</p>}</div>
                <footer><p>Обрано: {draft.length || 'усі'} · Зміни діють із наступної задачі.</p><Button disabled={disabled} onClick={() => { onChange(draft); changeOpen(false); }}>Застосувати теми</Button></footer>
            </DialogContent>
        </Dialog>
        <p className="puzzle-theme-count">{selected.length ? `Обрано тем: ${selected.length} · ${count.toLocaleString('uk-UA')} задач` : `${count.toLocaleString('uk-UA')} задач · ${themes.length} тем`}</p>
    </section>;
}
