import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { AnalysisMoveNode, classificationClasses, classificationLabel, MoveClassification, MoveNag, NAG_OPTIONS } from './model';
export function SettingToggle({ title, description, checked, onCheckedChange, }: {
    title: string;
    description: string;
    checked: boolean;
    onCheckedChange: (value: boolean) => void;
}) {
    return (<div className="flex items-center justify-between gap-3 rounded-[16px] border border-border bg-secondary px-3 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title}/>
    </div>);
}
