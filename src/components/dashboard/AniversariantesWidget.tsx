import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAniversariantes, Aniversariante } from '@/hooks/useAniversariantes';
import { useToast } from '@/hooks/use-toast';
import { Cake, MessageCircle, Users, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AniversariantesWidget = () => {
  const { toast } = useToast();
  const { getAniversariantesPorTipo, calcularIdade } = useAniversariantes();
  const [selectedAniversariante, setSelectedAniversariante] = useState<Aniversariante | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pacientes = getAniversariantesPorTipo('Paciente');
  const colaboradores = getAniversariantesPorTipo('Colaborador');

  const handleEnviarMensagem = (aniversariante: Aniversariante) => {
    const idade = calcularIdade(aniversariante.data_nascimento);
    const mensagemPadrao = `Olá ${aniversariante.nome}! 🎉\n\nParabéns pelos seus ${idade} anos! Desejamos muita saúde, felicidade e realizações!\n\nEquipe Espaço Terapia`;
    
    setSelectedAniversariante(aniversariante);
    setMensagem(mensagemPadrao);
    setIsModalOpen(true);
  };

  const handleConfirmarEnvio = () => {
    if (selectedAniversariante) {
      toast({
        title: 'Mensagem enviada!',
        description: `Mensagem de aniversário enviada para ${selectedAniversariante.nome}`,
      });
      setIsModalOpen(false);
      setSelectedAniversariante(null);
      setMensagem('');
    }
  };

  const renderAniversariante = (aniv: Aniversariante) => {
    const dataNasc = new Date(aniv.data_nascimento);
    const idade = calcularIdade(aniv.data_nascimento);
    const iniciais = aniv.nome
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return (
      <div
        key={aniv.id}
        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={aniv.foto_url} alt={aniv.nome} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {iniciais}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-navy truncate">{aniv.nome}</p>
          <p className="text-xs text-muted-foreground">
            {format(dataNasc, 'dd/MM', { locale: ptBR })} • {idade} anos
          </p>
          {aniv.unidade && (
            <p className="text-xs text-muted-foreground">{aniv.unidade}</p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleEnviarMensagem(aniv)}
          className="shrink-0"
        >
          <MessageCircle className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Aniversariantes Pacientes */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="bg-primary/10 text-primary p-2 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
              Aniversariantes — Pacientes
              <Badge variant="secondary" className="ml-auto">
                {pacientes.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pacientes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Cake className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum aniversariante este mês</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {pacientes.map(renderAniversariante)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aniversariantes Colaboradores */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="bg-success/10 text-success p-2 rounded-lg">
                <Briefcase className="h-4 w-4" />
              </div>
              Aniversariantes — Colaboradores
              <Badge variant="secondary" className="ml-auto">
                {colaboradores.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {colaboradores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Cake className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum aniversariante este mês</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {colaboradores.map(renderAniversariante)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Envio de Mensagem */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enviar Mensagem de Aniversário</DialogTitle>
          </DialogHeader>
          {selectedAniversariante && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedAniversariante.foto_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {selectedAniversariante.nome
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-navy">{selectedAniversariante.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAniversariante.telefone || selectedAniversariante.email}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mensagem</label>
                <Textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  A mensagem será enviada via WhatsApp/SMS/Email
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarEnvio}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar Mensagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
