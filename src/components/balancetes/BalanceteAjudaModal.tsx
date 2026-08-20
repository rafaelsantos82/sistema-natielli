import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  tituloModal,
  balanceteAjudaSecoes,
  balanceteAjudaFaq,
} from '@/lib/contabilidade/balanceteAjudaContent';

interface BalanceteAjudaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BalanceteAjudaModal({ open, onOpenChange }: BalanceteAjudaModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>{tituloModal}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-140px)] px-6">
          <div className="space-y-6 pb-4 pr-3">
            {balanceteAjudaSecoes.map((secao, index) => (
              <section key={secao.id} aria-labelledby={`ajuda-${secao.id}`}>
                {index > 0 && <Separator className="mb-6" />}
                <h3
                  id={`ajuda-${secao.id}`}
                  className="text-base font-semibold text-foreground mb-2"
                >
                  {secao.titulo}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {secao.paragrafos.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                {secao.passos && secao.passos.length > 0 && (
                  <ol className="mt-3 list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    {secao.passos.map((passo, i) => (
                      <li key={i} className="pl-1">
                        {passo}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            ))}

            <Separator />

            <section aria-labelledby="ajuda-faq">
              <h3 id="ajuda-faq" className="text-base font-semibold text-foreground mb-3">
                Perguntas frequentes
              </h3>
              <Accordion type="single" collapsible className="w-full">
                {balanceteAjudaFaq.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                      {item.pergunta}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {item.resposta}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t shrink-0 sm:justify-end">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
