import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { PuzzleProgress } from './training';
export function RatingRange({ value, disabled, onChange }: { value: PuzzleProgress['ratingRange']; disabled: boolean; onChange: (value: PuzzleProgress['ratingRange']) => void }) {
    const [min, setMin] = useState(String(value?.min ?? 1600)), [max, setMax] = useState(String(value?.max ?? 1900)), [error, setError] = useState('');
    return <details className="puzzle-range"><summary>{value ? `Діапазон: ${value.min}–${value.max}` : 'Точний діапазон'}</summary>
        <form onSubmit={event => { event.preventDefault(); const lower = Number(min), upper = Number(max); if (!min || !max || !Number.isInteger(lower) || !Number.isInteger(upper) || lower < 100 || upper > 4000 || lower > upper) { setError('Вкажи межі від 100 до 4000: мінімум не більший за максимум.'); return; } setError(''); onChange({ min: lower, max: upper }); }}>
            <fieldset disabled={disabled}><label>Від<input aria-label="Мінімальний рейтинг задач" type="number" min="100" max="4000" value={min} onChange={e => setMin(e.target.value)} /></label><label>До<input aria-label="Максимальний рейтинг задач" type="number" min="100" max="4000" value={max} onChange={e => setMax(e.target.value)} /></label></fieldset>
            {error && <p role="alert">{error}</p>}<Button type="submit" variant="outline" disabled={disabled}>Застосувати діапазон</Button>{value && <Button type="button" variant="ghost" disabled={disabled} onClick={() => onChange(null)}>Автоматична складність</Button>}
        </form>
    </details>;
}
