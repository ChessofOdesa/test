import { toast } from "sonner";
export async function copyPgn(pgn: string) { try {
    await navigator.clipboard.writeText(pgn);
    toast.success("PGN скопійовано.");
}
catch {
    toast.error("Не вдалося скопіювати PGN. Скористайтеся завантаженням.");
} }
export function downloadPgn(pgn: string, id: string) { const url = URL.createObjectURL(new Blob([pgn], { type: "application/x-chess-pgn;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `chess-of-odesa-${id}.pgn`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
