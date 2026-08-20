import type { Consulta } from '@/hooks/useConsultas';
import { UNIDADE_PADRAO_ID } from '@/hooks/useUnidades';

export function filterConsultasProfissional(
  consultas: Consulta[],
  profissionalId: string | null,
  escopoUnidade: string | null,
): Consulta[] {
  if (!profissionalId) return [];
  return consultas.filter((c) => {
    if (c.profissionalId !== profissionalId) return false;
    if (c.status === 'cancelada') return false;
    if (!escopoUnidade) return true;
    return (c.unidadeId ?? UNIDADE_PADRAO_ID) === escopoUnidade;
  });
}
