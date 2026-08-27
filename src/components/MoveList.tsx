import { ScrollArea } from "@/components/ui/scroll-area";

interface MoveListProps {
  moves: string[];
  currentMoveIndex?: number;
  onMoveClick?: (index: number) => void;
}

export default function MoveList({ moves, currentMoveIndex, onMoveClick }: MoveListProps) {
  const movePairs: { number: number; white: string; black?: string }[] = [];

  for (let index = 0; index < moves.length; index += 2) {
    movePairs.push({
      number: Math.floor(index / 2) + 1,
      white: moves[index],
      black: moves[index + 1],
    });
  }

  return (
    <div className="rounded-xl border border-border bg-gradient-card shadow-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Move list</h3>
      </div>

      <ScrollArea className="h-64">
        <div className="p-2">
          {movePairs.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">Make the first move to start the notation.</p>
          ) : (
            <div className="space-y-0.5">
              {movePairs.map((pair, pairIndex) => (
                <div key={pair.number} className="flex items-center text-xs">
                  <span className="mr-2 w-7 shrink-0 text-right text-muted-foreground">
                    {pair.number}.
                  </span>

                  <button
                    onClick={() => onMoveClick?.(pairIndex * 2)}
                    className={`min-w-[50px] rounded px-2 py-1 text-left transition-colors ${
                      currentMoveIndex === pairIndex * 2
                        ? "bg-primary/15 font-semibold text-primary"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    {pair.white}
                  </button>

                  {pair.black && (
                    <button
                      onClick={() => onMoveClick?.(pairIndex * 2 + 1)}
                      className={`min-w-[50px] rounded px-2 py-1 text-left transition-colors ${
                        currentMoveIndex === pairIndex * 2 + 1
                          ? "bg-primary/15 font-semibold text-primary"
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
