import { Label } from '@/components/ui/label';

interface ReadOnlyFieldProps {
  label: string;
  value?: string | number | null;
  className?: string;
}

export const ReadOnlyField = ({ label, value, className }: ReadOnlyFieldProps) => (
  <div className={`space-y-1 ${className ?? ''}`}>
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="min-h-[2.25rem] rounded-md border bg-muted/30 px-3 py-2 text-sm">
      {value != null && value !== '' ? (
        value
      ) : (
        <span className="italic text-muted-foreground">não informado</span>
      )}
    </div>
  </div>
);
