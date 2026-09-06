import { Button } from "@/components/ui/button";
import { Component, type ReactNode } from "react";
export class RouteBoundary extends Component<{
    children: ReactNode;
}, {
    failed: boolean;
}> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() { return this.state.failed ? <div className="page-container"><h1>Не вдалося відкрити сторінку</h1><p className="my-4 text-muted-foreground">Перевірте з’єднання та спробуйте ще раз.</p><Button onClick={() => window.location.reload()}>Оновити сторінку</Button></div> : this.props.children; }
}
