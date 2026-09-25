import type { ReactNode, SVGProps } from "react";

export type ChessIconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number | string };

function Icon({ size = 24, children, ...props }: ChessIconProps & { children: ReactNode }) {
  const labelled = props["aria-label"] || props["aria-labelledby"];
  return <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
    {...props}
    role={props.role ?? (labelled ? "img" : undefined)}
    aria-hidden={props["aria-hidden"] ?? (labelled ? undefined : true)}
  >{children}</svg>;
}

function Knight() {
  return <>
    <path d="M6 20h13M7 17.5v-2L9 13l-4-.8V9l3-2 .8-3 3 .7 3.7 3.1L18 11l-1.3 4.1 1.6 2.4H7Z" />
    <path d="M9.5 9h.01" strokeWidth="2.5" />
  </>;
}

function Pawn({ x = 0 }: { x?: number }) {
  return <g transform={`translate(${x} 0)`}>
    <circle cx="7" cy="6.2" r="1.7" />
    <path d="M6 10h2l1.2 5H4.8L6 10ZM4 18h6" />
  </g>;
}

export function KnightIcon(props: ChessIconProps) {
  return <Icon {...props}><Knight /></Icon>;
}

export function PuzzleIcon(props: ChessIconProps) {
  return <Icon {...props}><Knight /><circle cx="19" cy="5" r="2" strokeWidth="1.8" /><circle cx="19" cy="5" r=".45" fill="currentColor" stroke="none" /></Icon>;
}

export function OnlinePlayIcon(props: ChessIconProps) {
  return <Icon {...props}><Pawn /><Pawn x={10} /><path d="M11 11.5h2" /><circle cx="12" cy="11.5" r=".5" fill="currentColor" stroke="none" /></Icon>;
}

export function ComputerPlayIcon(props: ChessIconProps) {
  return <Icon {...props}><g transform="translate(-.7 -.5) scale(.85)"><Knight /></g><rect x="15.5" y="13.5" width="6" height="5.5" rx=".8" strokeWidth="1.8" /><path d="M17 21h3m-1.5-2v2" strokeWidth="1.8" /></Icon>;
}

export function StockfishIcon(props: ChessIconProps) {
  return <Icon {...props}><path d="M5 12c2.4-3.2 5.3-5 9.1-5 2.4 0 4 1.3 6 5-2 3.7-3.6 5-6 5-3.8 0-6.7-1.8-9.1-5Z" /><path d="m5 12-3-3v6l3-3Z" /><path d="M16 10.5h.01" strokeWidth="2.5" /><rect x="16" y="16" width="5" height="5" rx="1" strokeWidth="1.6" /><path d="M18.5 17.7v1.6" strokeWidth="1.5" /></Icon>;
}

export function AnalysisIcon(props: ChessIconProps) {
  return <Icon {...props}><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><path d="M3.5 10h7M10 3.5v6.5M6 17l4-3 3 1 5-6" /></Icon>;
}

export function LessonsIcon(props: ChessIconProps) {
  return <Icon {...props}><path d="M12 19c-2-1.4-4.4-1.8-8-1V5c3.6-.8 6-.4 8 1.3 2-1.7 4.4-2.1 8-1.3v13c-3.6-.8-6-.4-8 1ZM12 6.3V19" /><circle cx="8" cy="9.4" r=".8" strokeWidth="1.5" /><path d="M7 12.5h2" strokeWidth="1.5" /></Icon>;
}

export function OpeningsIcon(props: ChessIconProps) {
  return <Icon {...props}><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><path d="M3.5 10h8M10 3.5v8M7 17h3c3 0 2-5 7-5M10 17c3 0 2 3 7 3" /></Icon>;
}

export function TournamentIcon(props: ChessIconProps) {
  return <Icon {...props}><path d="M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v2c0 2 1.5 3 3.5 3M17 6h3v2c0 2-1.5 3-3.5 3M12 14v4M8 20h8" /><circle cx="12" cy="7" r=".8" strokeWidth="1.5" /><path d="M10.5 10h3" strokeWidth="1.5" /></Icon>;
}

export function FriendPlayIcon(props: ChessIconProps) {
  return <Icon {...props}><Pawn /><Pawn x={10} /><path d="M12 4v4m-2-2h4" strokeWidth="1.8" /></Icon>;
}
