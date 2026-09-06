import type { ReactNode } from "react";
export function Page({ title, eyebrow, children, action }: {
    title: string;
    eyebrow?: string;
    children: ReactNode;
    action?: ReactNode;
}) {
    return <div className="page-container"><div className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1></div>{action}</div>{children}</div>;
}
export function LoadingPage() { return <div className="page-container" role="status"><div className="loading-line"/>Завантаження…</div>; }
