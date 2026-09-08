import type { ReactNode } from "react";
export function GameInfo({ rows, children }: {
    rows: [
        string,
        ReactNode
    ][];
    children?: ReactNode;
}) { return <div className="room-info"><dl>{rows.map(([label, value]) => value != null && <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{children}</div>; }
