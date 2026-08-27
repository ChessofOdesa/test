import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import { Chess } from "chess.js";
// chessground supports CSS imports
import "chessground/assets/chessground.css";
import "chessground/assets/chessground.theme.css";
import * as ChessgroundLib from "chessground";

type Props = {
  fen?: string;
  orientation?: "white" | "black";
  onMove?: (from: string, to: string) => boolean;
  className?: string;
};

export default function ChessGroundWrapper({ fen = "start", orientation = "white", onMove, className }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cgRef = useRef<any>(null as any);

  useEffect(() => {
    if (!rootRef.current) return;
    const Chessground = (ChessgroundLib as any).Chessground || (ChessgroundLib as any).default || ChessgroundLib;
    const cfg: any = {
      fen: fen === "start" ? new Chess().fen() : fen,
      orientation,
      movable: {
        free: false,
        color: "both",
        events: {
          after: (orig: string, dest: string) => {
            try {
              if (!onMove) return;
              const ok = onMove(orig, dest);
              if (!ok && cgRef.current) cgRef.current.set({ fen });
            } catch (e) {
              // ignore
            }
          }
        }
      }
    };

    cgRef.current = Chessground(rootRef.current, cfg);
    return () => {
      try { cgRef.current?.destroy(); } catch (e) { }
      cgRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cgRef.current) cgRef.current.set({ fen });
  }, [fen]);

  useEffect(() => {
    if (cgRef.current) cgRef.current.set({ orientation });
  }, [orientation]);

  return <div ref={rootRef as MutableRefObject<HTMLDivElement | null>} className={className} />;
}
