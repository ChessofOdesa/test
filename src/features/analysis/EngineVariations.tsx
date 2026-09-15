import { GitBranch } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type EngineVariation = {
  id: string;
  rank: number;
  score: string;
  pv: string[];
  preview: { label: string; moves: string[]; fens: string[]; index: number };
};

export default function EngineVariations({ lines, fen, selectedId, selectedIndex, disabled, onPreview, onAdd }: {
  lines: EngineVariation[]; fen: string; selectedId?: string; selectedIndex?: number;
  disabled: boolean; onPreview: (line: EngineVariation, index: number) => void; onAdd: (line: EngineVariation) => void;
}) {
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const move = list.current?.querySelector<HTMLElement>('[aria-current="step"]');
    const row = move?.parentElement;
    if (!move || !row) return;
    const a = move.getBoundingClientRect(), b = row.getBoundingClientRect();
    const delta = a.left < b.left ? a.left - b.left : a.right > b.right ? a.right - b.right : 0;
    row.scrollLeft += delta;
  }, [selectedId, selectedIndex]);
  const fields = fen.split(' '), startsBlack = fields[1] === 'b', firstNumber = Number(fields[5]);
  return <ol ref={list} className="analysis-pv-list" aria-label="Варіанти Stockfish">{lines.map((line, row) => <li key={line.id} className={`analysis-pv-row${row === 0 ? ' is-best' : ''}${selectedId === line.id ? ' is-previewing' : ''}`} aria-label={row === 0 ? 'Найкращий хід Stockfish' : `Варіант Stockfish ${line.rank}`}>
    <div className={`analysis-pv-score${/^[-−]/.test(line.score) ? ' is-black' : ''}`} title="Оцінка з боку білих"><strong>{line.score}</strong><small>{row === 0 ? 'Кращий' : `№ ${line.rank}`}</small></div>
    <div className="analysis-pv-moves" role="group" aria-label={`Ходи варіанта ${line.rank}`}>{line.preview.moves.map((san, index) => {
      const ply = index + (startsBlack ? 1 : 0), number = firstNumber + Math.floor(ply / 2), black = ply % 2 === 1;
      const notation = `${number}${black ? '...' : '.'}`;
      return <button key={index} type="button" disabled={disabled} className={selectedId === line.id && selectedIndex === index ? 'is-selected' : undefined} aria-current={selectedId === line.id && selectedIndex === index ? 'step' : undefined} aria-label={`Варіант ${line.rank}: ${notation} ${san}`} onClick={() => onPreview(line, index)}>
        {(!black || index === 0) && <span className="analysis-pv-number">{notation}</span>}<span>{san}</span>
      </button>;
    })}</div>
    <Tooltip><TooltipTrigger asChild><button type="button" className="analysis-pv-add" aria-label={`Додати варіант Stockfish ${line.rank} до дерева`} disabled={disabled} onClick={() => onAdd(line)}><GitBranch size={17} /></button></TooltipTrigger><TooltipContent>Додати всю лінію до партії</TooltipContent></Tooltip>
  </li>)}</ol>;
}
