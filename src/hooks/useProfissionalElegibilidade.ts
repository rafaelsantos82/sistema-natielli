import { useCallback } from 'react';
import {
  useProfissionalDocumentos,
  PROFISSIONAL_DOCS_OBRIGATORIOS,
  DOCUMENTO_CATEGORIA_LABEL,
  type DocumentoCategoria,
} from './useProfissionalDocumentos';
import { useProfissionais } from './useProfissionais';

export interface ElegibilidadeAgenda {
  elegivel: boolean;
  motivos: string[];
  documentosPendentes: DocumentoCategoria[];
}

/**
 * Fonte única de verdade para "este profissional pode receber novos
 * agendamentos?". Bloqueia criação de consultas quando faltam documentos
 * obrigatórios ou o status do profissional impede atendimento.
 *
 * Centralizar a regra evita bypass por telas paralelas (Agenda, Consultas,
 * AgendaProfissional) e garante consistência com o fluxo de aprovação
 * (mem://features/atendimento-prontuario-pagamento).
 */
export const useProfissionalElegibilidade = () => {
  const { getById } = useProfissionais();
  const { statusObrigatorios } = useProfissionalDocumentos();

  const verificar = useCallback(
    (profissionalId: string): ElegibilidadeAgenda => {
      const motivos: string[] = [];
      const prof = getById(profissionalId);

      if (!prof) {
        return {
          elegivel: false,
          motivos: ['Profissional não encontrado.'],
          documentosPendentes: [...PROFISSIONAL_DOCS_OBRIGATORIOS],
        };
      }

      if (prof.status !== 'ativo') {
        motivos.push(`Profissional está ${prof.status}.`);
      }

      const docs = statusObrigatorios(profissionalId);
      if (!docs.completos) {
        const labels = docs.pendentes.map((c) => DOCUMENTO_CATEGORIA_LABEL[c]).join(', ');
        motivos.push(`Documentos obrigatórios pendentes: ${labels}.`);
      }

      return {
        elegivel: motivos.length === 0,
        motivos,
        documentosPendentes: docs.pendentes,
      };
    },
    [getById, statusObrigatorios],
  );

  return { verificar };
};
