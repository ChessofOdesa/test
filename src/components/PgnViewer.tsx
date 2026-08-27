import { useEffect, useRef } from "react";
import startPgnViewer from "@lichess-org/pgn-viewer";

interface PgnViewerProps {
  pgn: string;
  className?: string;
}

export default function PgnViewer({ pgn, className }: PgnViewerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<any>(null);

  useEffect(() => {
    const cssId = "lichess-pgn-viewer-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "/lichess-pgn-viewer.css";
      document.head.appendChild(link);
    }
    if (!ref.current) return;
    try {
      ctrlRef.current = startPgnViewer(ref.current, { pgn });
    } catch (e) {
      console.error("pgn-viewer init error", e);
    }

    return () => {
      // no explicit destroy API; clear container
      if (ref.current) ref.current.innerHTML = "";
      ctrlRef.current = null;
    };
  }, [pgn]);

  return <div ref={ref} className={className} />;
}
