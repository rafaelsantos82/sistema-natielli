import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Calendar, User, Package } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type Comodato } from '@/hooks/useComodatos';

interface ComodatoNotificationsProps {
  comodatos: Comodato[];
}

export const ComodatoNotifications = ({ comodatos }: ComodatoNotificationsProps) => {
  const [diasAntecedencia, setDiasAntecedencia] = useState<number>(3);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState<boolean>(true);

  const comodatosProximosVencimento = useMemo(() => {
    if (!notificacoesAtivas) return [];

    const hoje = new Date();
    return comodatos.filter((comodato) => {
      if (comodato.status === 'Devolvido') return false;

      const dataVencimento = parseISO(comodato.data_devolucao_prevista);
      const diasRestantes = differenceInDays(dataVencimento, hoje);

      return diasRestantes >= 0 && diasRestantes <= diasAntecedencia;
    });
  }, [comodatos, diasAntecedencia, notificacoesAtivas]);

  const comodatosVencendoHoje = useMemo(() => {
    const hoje = new Date();
    return comodatosProximosVencimento.filter((comodato) => {
      const dataVencimento = parseISO(comodato.data_devolucao_prevista);
      return differenceInDays(dataVencimento, hoje) === 0;
    });
  }, [comodatosProximosVencimento]);

  const toggleNotificacoes = () => {
    setNotificacoesAtivas(!notificacoesAtivas);
  };

  const getDiasRestantes = (dataVencimento: string): number => {
    const hoje = new Date();
    const data = parseISO(dataVencimento);
    return differenceInDays(data, hoje);
  };

  return (
    <div className="space-y-4">
      {/* Configuração de Notificações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {notificacoesAtivas ? (
                  <Bell className="h-5 w-5 text-primary" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                Notificações de Vencimento
              </CardTitle>
              <CardDescription>
                Configure alertas para comodatos próximos ao vencimento
              </CardDescription>
            </div>
            <Button
              variant={notificacoesAtivas ? 'default' : 'outline'}
              size="sm"
              onClick={toggleNotificacoes}
            >
              {notificacoesAtivas ? (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Ativo
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Inativo
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="diasAntecedencia">Dias de antecedência</Label>
                <Input
                  id="diasAntecedencia"
                  type="number"
                  min="1"
                  max="30"
                  value={diasAntecedencia}
                  onChange={(e) => setDiasAntecedencia(parseInt(e.target.value) || 3)}
                  disabled={!notificacoesAtivas}
                  className="max-w-[150px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alertar quando faltarem até {diasAntecedencia} dias para vencimento
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Vencimento Iminente */}
      {notificacoesAtivas && comodatosVencendoHoje.length > 0 && (
        <Alert variant="destructive">
          <Calendar className="h-4 w-4" />
          <AlertTitle>Vencimento Hoje!</AlertTitle>
          <AlertDescription>
            <strong>{comodatosVencendoHoje.length}</strong> comodato
            {comodatosVencendoHoje.length === 1 ? ' vence' : 's vencem'} hoje.
            Entre em contato com os pacientes para devolução.
          </AlertDescription>
        </Alert>
      )}

      {notificacoesAtivas && comodatosProximosVencimento.length > 0 && (
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertTitle>Comodatos Próximos ao Vencimento</AlertTitle>
          <AlertDescription>
            {comodatosProximosVencimento.length} comodato
            {comodatosProximosVencimento.length === 1 ? '' : 's'} com vencimento nos próximos{' '}
            {diasAntecedencia} dias.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Comodatos Próximos ao Vencimento */}
      {notificacoesAtivas && comodatosProximosVencimento.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertas de Vencimento</CardTitle>
            <CardDescription>
              Comodatos que vencem nos próximos {diasAntecedencia} dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {comodatosProximosVencimento.map((comodato) => {
                const diasRestantes = getDiasRestantes(comodato.data_devolucao_prevista);
                return (
                  <div
                    key={comodato.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{comodato.item_nome}</span>
                        <Badge variant="outline">Qtd: {comodato.quantidade}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{comodato.paciente_nome}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Vence: {format(parseISO(comodato.data_devolucao_prevista), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={diasRestantes === 0 ? 'destructive' : diasRestantes <= 1 ? 'default' : 'secondary'}
                      >
                        {diasRestantes === 0
                          ? 'Hoje'
                          : diasRestantes === 1
                          ? 'Amanhã'
                          : `${diasRestantes} dias`}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há comodatos próximos ao vencimento */}
      {notificacoesAtivas && comodatosProximosVencimento.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum comodato próximo ao vencimento</p>
              <p className="text-sm mt-2">
                Todos os comodatos ativos vencem em mais de {diasAntecedencia} dias
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
