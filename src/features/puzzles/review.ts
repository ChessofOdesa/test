import { Chess, type Square } from 'chess.js';
import { analyzeFenWithStockfish } from '@/lib/stockfish';
import { applySolutionMove } from './model';
import { attemptFen, type Attempt } from './training';
export type PuzzleFrame = { fen: string; san: string; squares: Square[] };
export type PuzzleReviewLine = { frames: PuzzleFrame[]; score: string; depth: number | null };
export type PuzzleReviewResult = PuzzleReviewLine & { explanation: string; lines: PuzzleReviewLine[] };
const scoreLabel = (cp: number | null, mate: number | null) => mate != null ? `M${mate}` : cp != null ? `${cp >= 0 ? '+' : ''}${(cp / 100).toFixed(2)}` : '—';
export const THEME_IDEAS: Record<string, string> = {
    'Захисний хід': 'Знайди відповідь на загрозу суперника, зберігаючи свої можливості.',
    'Тихий хід': 'Перевір загрози, які створює хід без шаху та взяття.',
    'Цугцванг': 'Знайди позицію, де обов’язок ходити погіршує становище суперника.',
    'Відкритий король': 'Використай слабкий захист короля й відкриті лінії.',
    'Атака на королівському фланзі': 'Скоординуй фігури для конкретних загроз на королівському фланзі.',
    'Атака на ферзевому фланзі': 'Шукай форсовані загрози на ферзевому фланзі.',
    'Слабке перетворення': 'Перевір перетворення на коня, туру або слона замість ферзя.',
    'Мат у 2': 'Знайди перший хід і матову відповідь на кожний захист.',
    'Мат у 3': 'Розрахуй матову сітку на три свої ходи з урахуванням захисту.',
    'Подвійний шах': 'Дві фігури одночасно дають шах: захищатися потрібно ходом короля.',
    'Перекриття': 'Перекрий лінію взаємодії фігур суперника.',
    'Проміжний хід': 'Перед очікуваною відповіддю знайди сильнішу загрозу.',
    'Відволікання': 'Відведи захисника від важливого поля або фігури.',
    'Зв’язка': 'Використай обмежену рухливість зв’язаної фігури.',
    'Наскрізний напад': 'Атакуй ціннішу фігуру, щоб дістатися до фігури за нею.',
    'Заманювання': 'Змусь фігуру суперника зайняти невигідне поле.',
    'Звільнення поля': 'Звільни поле або лінію для вирішального ходу.',
    'Відкритий напад': 'Відійди однією фігурою, відкриваючи атаку іншої.',
    'Мат на останній горизонталі': 'Використай обмежені поля відступу короля на останній горизонталі.',
    'Перетворення пішака': 'Обери правильну фігуру для перетворення пішака.',
    'Жертва': 'Оціни конкретне продовження після віддачі матеріалу.',
    'Вилка': 'Створи одночасні загрози кільком цілям.',
    'Мат': 'Шукай форсовані шахи та відрізай королю поля відступу.',
    'Мат в 1': 'Дай шах, від якого немає легального захисту.',
    'Туровий ендшпіль': 'Перевір активність тури, короля й прохідних пішаків.',
    'Пішаковий ендшпіль': 'Розрахуй темпи, проходження пішака та ходи короля.',
    'Ендшпіль': 'Перевір активність короля та форсовані загрози.',
    'Дебют': 'Шукай конкретну тактику в дебютній позиції.',
    'Тактика': 'Перевір шахи, взяття та прямі загрози.',
};
export function framesForLine(fen: string, moves: string[]): PuzzleFrame[] {
    const game = new Chess(fen), frames: PuzzleFrame[] = [{ fen: game.fen(), san: 'Початок', squares: [] }];
    for (const uci of moves) {
        const move = applySolutionMove(game, uci);
        frames.push({ fen: game.fen(), san: move.san, squares: [move.from, move.to] });
        if (game.isGameOver()) break;
    }
    return frames;
}
export async function reviewPuzzle(attempt: Attempt, mistake: number | null, signal: AbortSignal, options = { depth: 18, multiPv: 3 }): Promise<PuzzleReviewResult> {
    if (!attempt.complete) throw new Error('Спочатку заверши задачу.');
    const error = mistake == null ? null : attempt.mistakes?.[mistake];
    if (mistake != null && !error) throw new Error('Хід не знайдено.');
    const root = error ? attemptFen({ ...attempt, step: error.step }) : attempt.puzzle.fen;
    const game = new Chess(root), prefix: string[] = [];
    if (error) { applySolutionMove(game, error.move); prefix.push(error.move); }
    if (game.isGameOver()) {
        const line = { frames: framesForLine(root, prefix), score: game.isCheckmate() ? 'Мат' : 'Нічия', depth: null };
        return { ...line, lines: [line], explanation: game.isCheckmate() ? 'Позиція завершилася матом.' : 'Цей хід завершує позицію нічиєю.' };
    }
    const result = await analyzeFenWithStockfish(game.fen(), options.depth, undefined, 15000, { signal, workerOnly: true, multiPv: options.multiPv, movetime: 5000, timeoutMs: 15000 });
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    if ((result.depth || 0) < 14 || !result.pv.length || result.scoreCp == null && result.scoreMate == null) throw new Error('Недостатньо даних Stockfish. Спробуй повторити розбір.');
    const frames = framesForLine(root, [...prefix, ...result.pv.slice(0, 10)]);
    const score = result.scoreMate != null ? `${result.scoreMate > 0 ? 'Білі' : 'Чорні'} ставлять мат за ${Math.abs(result.scoreMate)}` : `Оцінка білих: ${result.scoreCp! >= 0 ? '+' : ''}${(result.scoreCp! / 100).toFixed(2)}`;
    const explanation = error
        ? `Після ${frames[1].san} Stockfish знаходить відповідь ${frames[2]?.san || '—'}. Переглянь продовження на дошці.`
        : `${THEME_IDEAS[attempt.puzzle.theme] || THEME_IDEAS['Тактика']} Варіант Stockfish починається з ${frames[1]?.san || '—'}${frames[2] ? `; найсильніша знайдена відповідь — ${frames[2].san}` : ''}.`;
    const lines = (result.lines?.length ? result.lines : [result]).filter(line => (line.depth ?? result.depth ?? 0) >= 14 && line.pv.length && (line.scoreCp != null || line.scoreMate != null)).slice(0, options.multiPv).flatMap(line => {
        try { return [{ frames: framesForLine(root, [...prefix, ...line.pv.slice(0, 14)]), score: scoreLabel(line.scoreCp, line.scoreMate), depth: line.depth ?? result.depth ?? null }]; } catch { return []; }
    });
    if (!lines.length) throw new Error('Недостатньо даних Stockfish. Спробуй повторити розбір.');
    return { frames, explanation, score, depth: result.depth || null, lines };
}
