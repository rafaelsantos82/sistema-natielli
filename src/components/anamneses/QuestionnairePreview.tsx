import type { QuestionItem } from '@/hooks/useAnamneses';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  nome: string;
  especialidade: string;
  versao: string;
  questions: QuestionItem[];
}

/** Renderiza o questionário em modo somente-pré-visualização (campos desabilitados). */
export const QuestionnairePreview = ({
  nome,
  especialidade,
  versao,
  questions,
}: Props) => {
  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/30 p-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-base">{nome || 'Sem título'}</h3>
            <p className="text-xs text-muted-foreground">
              {especialidade || '—'} • v{versao || '1.0'}
            </p>
          </div>
          <Badge variant="outline">{questions.length} perguntas</Badge>
        </div>
      </div>

      <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
        {questions.map((q, idx) => (
          <div key={q.linkId + idx} className="space-y-2">
            <Label className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground mt-0.5">
                #{idx + 1}
              </span>
              <span className="flex-1">
                {q.text || <em className="text-muted-foreground">Pergunta sem enunciado</em>}
                {q.required && <span className="text-destructive ml-1">*</span>}
              </span>
              {q.enableWhen && q.enableWhen.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  condicional
                </Badge>
              )}
            </Label>

            {q.type === 'text' && <Textarea disabled placeholder="Resposta longa..." rows={2} />}
            {q.type === 'string' && <Input disabled placeholder="Resposta curta..." />}
            {q.type === 'integer' && <Input disabled type="number" placeholder="0" />}
            {q.type === 'decimal' && (
              <Input disabled type="number" step="0.1" placeholder="0,0" />
            )}
            {q.type === 'date' && <Input disabled type="date" />}
            {q.type === 'boolean' && (
              <RadioGroup disabled className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="sim" id={`p-${idx}-sim`} disabled />
                  <Label htmlFor={`p-${idx}-sim`} className="font-normal">Sim</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="nao" id={`p-${idx}-nao`} disabled />
                  <Label htmlFor={`p-${idx}-nao`} className="font-normal">Não</Label>
                </div>
              </RadioGroup>
            )}
            {q.type === 'choice' && (
              q.options && q.options.length > 0 ? (
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {q.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  (sem opções configuradas)
                </p>
              )
            )}
          </div>
        ))}

        {questions.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-6">
            Nenhuma pergunta para pré-visualizar.
          </p>
        )}
      </div>
    </div>
  );
};
