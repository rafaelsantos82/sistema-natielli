import type { ListMeta } from '@/lib/api/types';

export type ContratoStatus =
  | 'Rascunho'
  | 'Aguardando Assinatura'
  | 'Assinado'
  | 'Recusado'
  | 'Expirado';

export type ContratoTipo =
  | 'Atendimento'
  | 'Prestação de Serviço'
  | 'Termo de Responsabilidade'
  | 'Outros';

export interface ContratoDTO {
  id: string;
  titulo: string;
  tipo: ContratoTipo | string;
  paciente_id?: string;
  paciente_nome?: string;
  profissional_id?: string;
  profissional_nome?: string;
  conteudo?: string;
  arquivo_nome?: string;
  arquivo_mime?: string;
  arquivo_tamanho_bytes?: number;
  tem_arquivo?: boolean;
  status: ContratoStatus | string;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

export interface ContratoMetadataPayload {
  titulo: string;
  tipo: string;
  paciente_id?: string;
  paciente_nome?: string;
  profissional_id?: string;
  profissional_nome?: string;
  status?: string;
}

export type UpdateContratoPayload = ContratoMetadataPayload;

export interface ListContratosParams {
  q?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export interface CompartilharContratoPayload {
  expiracao_horas?: number;
  pode_visualizar?: boolean;
  pode_baixar?: boolean;
}

export interface CompartilharContratoResult {
  token: string;
  url: string;
  expira_em: string;
}

export interface SignatarioPayload {
  nome: string;
  email: string;
  tipo: string;
  cpf?: string;
  parentesco?: string;
  ordem: number;
}

export interface SolicitarAssinaturaPayload {
  mensagem?: string;
  expira_em_horas?: number;
  signatarios: SignatarioPayload[];
}

export interface SignatarioLinkDTO {
  id: string;
  nome: string;
  email: string;
  url: string;
  token: string;
}

export interface SolicitarAssinaturaResult {
  solicitacao_id: string;
  signatarios: SignatarioLinkDTO[];
}

export interface ContratoCompartilhadoPublicDTO {
  titulo: string;
  tipo: string;
  status: string;
  conteudo?: string;
  arquivo_nome?: string;
  arquivo_mime?: string;
  tem_arquivo?: boolean;
  download_url?: string;
  paciente_nome?: string;
  pode_visualizar: boolean;
  pode_baixar: boolean;
  expira_em: string;
}

export interface ContratoAssinaturaPublicDTO {
  signatario_nome: string;
  signatario_email: string;
  signatario_tipo: string;
  contrato_titulo: string;
  contrato_tipo: string;
  conteudo?: string;
  arquivo_nome?: string;
  arquivo_mime?: string;
  tem_arquivo?: boolean;
  download_url?: string;
  status_signatario: string;
  ja_assinado: boolean;
}

export type { ListMeta };
