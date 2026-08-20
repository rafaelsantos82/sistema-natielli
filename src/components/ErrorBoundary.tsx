import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Rótulo da área (ex.: rota) para diagnóstico */
  area?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Impede tela branca por exceções de renderização.
 * Não limpa sessão — falhas de UI não devem deslogar o usuário (OWASP: fail gracefully).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Erro inesperado' };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', this.props.area, error, info.componentStack);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <Card className="max-w-lg w-full border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Não foi possível carregar esta página
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ocorreu um erro ao exibir o conteúdo
              {this.props.area ? ` (${this.props.area})` : ''}. Sua sessão foi mantida — use
              &quot;Tentar novamente&quot; ou volte ao início.
            </p>
            {import.meta.env.DEV && (
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                {this.state.message}
              </pre>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={this.handleRetry}>
                Tentar novamente
              </Button>
              <Button type="button" variant="outline" onClick={() => window.location.assign('/')}>
                Ir ao início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
