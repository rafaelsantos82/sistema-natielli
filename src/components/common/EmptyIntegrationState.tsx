import { Inbox } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EmptyIntegrationStateProps {
  moduleName: string;
  description?: string;
}

export function EmptyIntegrationState({ moduleName, description }: EmptyIntegrationStateProps) {
  return (
    <Alert className="border-muted bg-muted/30">
      <Inbox className="h-4 w-4" />
      <AlertTitle className="text-sm font-medium">{moduleName}</AlertTitle>
      <AlertDescription className="text-sm text-muted-foreground">
        {description ?? 'Nenhum registro encontrado.'}
      </AlertDescription>
    </Alert>
  );
}
