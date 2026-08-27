import { memo } from "react";

interface ChessPieceProps {
  piece: { type: string; color: string } | null;
  size?: number;
}

// Використовуємо стандартні SVG шляхи для класичного вигляду (Staunton)
const PIECE_PATHS: Record<string, string> = {
  k: "M22.5 11.63V6M20 8h5m-2.5 5.13c-5.17 0-7 4.14-7 8.87 0 1.33.19 2.5.55 3.5h12.9c.36-1 .55-2.17.55-3.5 0-4.73-1.83-8.87-7-8.87ZM11.5 29.5h22M14.5 32.5h16m-18-6h20",
  q: "M9 26c8.5-1.5 21-1.5 27 0l-2-12-7 11V11l-5.5 13.5-5.5-13.5V25L9 14l-2 12Zm0 3h27m-24 3h21",
  r: "M9 32.5h27v-3H9v3ZM12 29.5h21v-12H12v12ZM11 14V9h4v2h5V9h5v2h5V9h4v5H11Z",
  b: "M9 32.5h27v-3H9v3Zm6-3c0-12 15-12 15 0M22.5 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM17.5 18s2.5 2 5 2 5-2 5-2",
  n: "M22 10c10.5 1 16.5 8 16 25H15c0-9 10-6.5 8-25Zm-5 2v10M24 18h.01",
  p: "M22.5 9a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-7 16c0-5 14-5 14 0M11 32.5h23v-3H11v3Z",
};

const ChessPiece = memo(({ piece, size = 48 }: ChessPieceProps) => {
  if (!piece) return null;

  const path = PIECE_PATHS[piece.type.toLowerCase()];
  if (!path) return null;

  // Кольорова схема: кремовий для білих, темно-сірий/графіт для чорних
  const isWhite = piece.color === "w";
  const fillColor = isWhite ? "#f9f9f9" : "#333333";
  const strokeColor = isWhite ? "#222222" : "#eeeeee";

  return (
    <div
      className="flex items-center justify-center select-none pointer-events-none"
      style={{
        width: size,
        height: size,
        filter: isWhite 
          ? "drop-shadow(0 2px 2px rgba(0,0,0,0.2))" 
          : "drop-shadow(0 2px 3px rgba(0,0,0,0.4))",
      }}
    >
      <svg
        viewBox="0 0 45 45"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={path} />
        </g>
      </svg>
    </div>
  );
});

ChessPiece.displayName = "ChessPiece";

export default ChessPiece;