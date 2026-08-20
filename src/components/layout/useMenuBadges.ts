import { useMemo } from 'react';
import { useConsultas } from '@/hooks/useConsultas';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useProfissionalElegibilidade } from '@/hooks/useProfissionalElegibilidade';

export type MenuBadgeKey =
  | 'consultas_pendentes'
  | 'aprovacoes_pendentes'
  | 'profissionais_pendentes';

/**
 * Agrega contagens de pendências para exibir badges no sidebar.
 * Reutiliza hooks existentes — sem novas fontes de dados.
 */
export const useMenuBadges = (): Record<MenuBadgeKey, number> => {
  const { consultas } = useConsultas();
  const { list } = useProfissionais();
  const { verificar } = useProfissionalElegibilidade();

  return useMemo(() => {
    const consultasPendentes = consultas.filter(
      (c) =>
        c.status_atendimento === 'atendimento_pendente' ||
        c.status_atendimento === 'aguardando_prontuario',
    ).length;

    const aprovacoesPendentes = consultas.filter(
      (c) => c.status_atendimento === 'pronto_para_aprovacao',
    ).length;

    const profissionaisPendentes = list().filter(
      (p) => !verificar(p.id).elegivel,
    ).length;

    return {
      consultas_pendentes: consultasPendentes,
      aprovacoes_pendentes: aprovacoesPendentes,
      profissionais_pendentes: profissionaisPendentes,
    };
  }, [consultas, list, verificar]);
};
