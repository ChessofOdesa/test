import { ScrollArea } from "@/components/ui/scroll-area";

interface MoveListProps {
  moves: string[];
  currentMoveIndex?: number;
  onMoveClick?: (index: number) => void;
  heightClassName?: string;
}

export default function MoveList({ moves, currentMoveIndex, onMoveClick, heightClassName = "h-64" }: MoveListProps) {
  const movePairs: { number: number; white: string; black?: string }[] = [];

  for (let index = 0; index < moves.length; index += 2) {
    movePairs.push({
      number: Math.floor(index / 2) + 1,
      white: moves[index],
      black: moves[index + 1],
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <ScrollArea className={heightClassName}>
        <div className="p-2.5">
          {movePairs.length === 0 ? (
            <div className="grid min-h-36 place-items-center px-5 text-center">
              <p className="text-sm leading-5 text-muted-foreground">Зробіть перший хід — тут з’явиться запис партії.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {movePairs.map((pair, pairIndex) => (
                <div key={pair.number} className="grid grid-cols-[32px_1fr_1fr] items-center gap-1 text-sm">
                  <span className="pr-1 text-right text-xs font-semibold text-muted-foreground">
                    {pair.number}.
                  </span>

                  <button
                    type="button"
                    onClick={() => onMoveClick?.(pairIndex * 2)}
                    className={`min-w-0 rounded-md px-2.5 py-1.5 text-left font-semibold transition-colors ${
                      currentMoveIndex === pairIndex * 2
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    {pair.white}
                  </button>

                  {pair.black && (
                    <button
                      type="button"
                      onClick={() => onMoveClick?.(pairIndex * 2 + 1)}
                      className={`min-w-0 rounded-md px-2.5 py-1.5 text-left font-semibold transition-colors ${
                        currentMoveIndex === pairIndex * 2 + 1
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {pair.black}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
