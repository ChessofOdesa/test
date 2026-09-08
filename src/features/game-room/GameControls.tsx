import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
export type SecondaryAction = {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    disabled?: boolean;
};
export function GameControls({ children, more = [] }: {
    children: ReactNode;
    more?: SecondaryAction[];
}) { return <div className="room-controls">{children}{more.length > 0 && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Інші дії" title="Інші дії"><MoreHorizontal size={19}/></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{more.map(action => <DropdownMenuItem key={action.label} onSelect={action.onClick} disabled={action.disabled} className="gap-2">{action.icon}{action.label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>}</div>; }
export function ConfirmAction({ open, onCancel, onConfirm, title, description, confirm = "Підтвердити" }: {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirm?: string;
}) { return <AlertDialog open={open} onOpenChange={value => { if (!value)
    onCancel(); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Скасувати</AlertDialogCancel><AlertDialogAction onClick={onConfirm}>{confirm}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>; }
