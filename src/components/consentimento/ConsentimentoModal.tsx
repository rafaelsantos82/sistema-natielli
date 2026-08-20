import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useConsentimentos, TermoConsentimento } from '@/hooks/useConsentimentos';
import { Shield, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConsentimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentir: (responsavelLegal?: {
    nome: string;
    cpf: string;
    parentesco: string;
    assinatura: string;
  }) => void;
  paciente: {
    id: string;
    nome: string;
    data_nascimento?: string;
  };
  tipo: TermoConsentimento['tipo'];
}

export const ConsentimentoModal = ({
  isOpen,
  onClose,
  onConsentir,
  paciente,
  tipo,
}: ConsentimentoModalProps) => {
  const { getTermoAtivo } = useConsentimentos();
  const [aceito, setAceito] = useState(false);
  const [responsavelNome, setResponsavelNome] = useState('');
  const [responsavelCpf, setResponsavelCpf] = useState('');
  const [responsavelParentesco, setResponsavelParentesco] = useState('');
  const [assinatura, setAssinatura] = useState('');

  const termo = getTermoAtivo(tipo);

  // Calcular se é menor de idade
  const isMenor = paciente.data_nascimento
    ? (() => {
        const hoje = new Date();
        const nascimento = new Date(paciente.data_nascimento);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mesAtual = hoje.getMonth();
        const mesNascimento = nascimento.getMonth();
        if (
          mesAtual < mesNascimento ||
          (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())
        ) {
          idade--;
        }
        return idade < 18;
      })()
    : false;

  const handleConfirmar = () => {
    if (!aceito) return;

    if (isMenor) {
      if (!responsavelNome || !responsavelCpf || !responsavelParentesco || !assinatura) {
        return;
      }
      onConsentir({
        nome: responsavelNome,
        cpf: responsavelCpf,
        parentesco: responsavelParentesco,
        assinatura,
      });
    } else {
      onConsentir();
    }

    // Reset form
    setAceito(false);
    setResponsavelNome('');
    setResponsavelCpf('');
    setResponsavelParentesco('');
    setAssinatura('');
  };

  if (!termo) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {termo.titulo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Paciente */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium text-navy">Paciente: {paciente.nome}</p>
            <p className="text-xs text-muted-foreground">
              Versão do termo: {termo.versao} • {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>

          {/* Alerta para Menores */}
          {isMenor && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Este paciente é menor de idade. É obrigatório o consentimento do responsável legal.
              </AlertDescription>
            </Alert>
          )}

          {/* Texto do Termo */}
          <ScrollArea className="h-[250px] w-full rounded-md border p-4">
            <div className="whitespace-pre-wrap text-sm">{termo.texto}</div>
          </ScrollArea>

          {/* Dados do Responsável Legal (se menor) */}
          {isMenor && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium text-sm text-navy">Dados do Responsável Legal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="responsavel_nome">Nome Completo *</Label>
                  <Input
                    id="responsavel_nome"
                    value={responsavelNome}
                    onChange={(e) => setResponsavelNome(e.target.value)}
                    placeholder="Nome do responsável"
                  />
                </div>
                <div>
                  <Label htmlFor="responsavel_cpf">CPF *</Label>
                  <Input
                    id="responsavel_cpf"
                    value={responsavelCpf}
                    onChange={(e) => setResponsavelCpf(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="responsavel_parentesco">Parentesco/Relação *</Label>
                <Input
                  id="responsavel_parentesco"
                  value={responsavelParentesco}
                  onChange={(e) => setResponsavelParentesco(e.target.value)}
                  placeholder="Ex: Pai, Mãe, Tutor Legal"
                />
              </div>
              <div>
                <Label htmlFor="assinatura">Nome para Assinatura Digital *</Label>
                <Input
                  id="assinatura"
                  value={assinatura}
                  onChange={(e) => setAssinatura(e.target.value)}
                  placeholder="Digite seu nome completo como assinatura"
                />
              </div>
            </div>
          )}

          {/* Checkbox de Aceite */}
          <div className="flex items-start space-x-2 border-t pt-4">
            <Checkbox
              id="aceite"
              checked={aceito}
              onCheckedChange={(checked) => setAceito(checked as boolean)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="aceite"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Li e concordo com os termos acima
              </Label>
              <p className="text-xs text-muted-foreground">
                {isMenor
                  ? 'Declaro que sou responsável legal pelo paciente e autorizo o atendimento'
                  : 'Declaro que compreendi todas as informações e concordo com os termos'}
              </p>
            </div>
          </div>

          {/* Informações sobre Direitos */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Seus direitos:</strong> Este consentimento pode ser revogado a qualquer momento.
              Seus dados serão tratados conforme a LGPD (Lei 13.709/2018).
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={
              !aceito ||
              (isMenor && (!responsavelNome || !responsavelCpf || !responsavelParentesco || !assinatura))
            }
          >
            Confirmar Consentimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
