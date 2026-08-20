import type { ReactNode } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, UserRound } from 'lucide-react';
import type { Profissional } from '@/hooks/useProfissionais';

type UnidadeOption = { id: string; nome: string };

type Props = {
  podeSelecionarProfissional: boolean;
  profissionalId: string | null;
  profissionaisOpcoes: Profissional[];
  selecionarProfissional: (id: string) => void;
  isLoadingProfissionais: boolean;
  unidadeFiltro: string;
  setUnidadeFiltro: (value: string) => void;
  unidades: UnidadeOption[];
  podeVerTodas: boolean;
  actions?: ReactNode;
  heading?: ReactNode;
};

export const ProfissionalUnidadeToolbar = ({
  podeSelecionarProfissional,
  profissionalId,
  profissionaisOpcoes,
  selecionarProfissional,
  isLoadingProfissionais,
  unidadeFiltro,
  setUnidadeFiltro,
  unidades,
  podeVerTodas,
  actions,
  heading,
}: Props) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="min-w-0 flex-1 space-y-2">
      {podeSelecionarProfissional && (
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Select
            value={profissionalId ?? ''}
            onValueChange={selecionarProfissional}
            disabled={isLoadingProfissionais || profissionaisOpcoes.length === 0}
          >
            <SelectTrigger className="w-full max-w-md" aria-label="Profissional">
              <SelectValue
                placeholder={
                  isLoadingProfissionais
                    ? 'Carregando profissionais...'
                    : 'Selecione o profissional'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {profissionaisOpcoes.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {heading}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Select value={unidadeFiltro} onValueChange={setUnidadeFiltro}>
          <SelectTrigger className="w-[200px]" aria-label="Filtrar por unidade">
            <SelectValue placeholder="Unidade" />
          </SelectTrigger>
          <SelectContent>
            {podeVerTodas && <SelectItem value="all">Todas as unidades</SelectItem>}
            {unidades.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {actions}
    </div>
  </div>
);
