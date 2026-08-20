export interface PacienteUnidadeDTO {
  unidade_id: string;
  principal: boolean;
  ativo: boolean;
}

export interface VacinaDTO {
  data: string;
  tipo: string;
}

export interface DocumentoAnexoDTO {
  tipo: string;
  arquivo: string;
  descricao?: string;
}

export interface PacienteDTO {
  id: string;
  nome_completo: string;
  nome_social?: string;
  data_nascimento: string;
  sexo_biologico: string;
  cpf?: string;
  rg_numero?: string;
  rg_orgao?: string;
  foto?: string;
  tel_principal: string;
  tel_secundario?: string;
  email?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf: string;
  cep: string;
  responsavel_nome: string;
  responsavel_cpf?: string;
  responsavel_parentesco?: string;
  responsavel_tel?: string;
  responsavel_email?: string;
  contato_emergencia_nome?: string;
  contato_emergencia_tel?: string;
  pessoas_autorizadas_busca?: string[];
  escola?: string;
  serie_ano?: string;
  necessidades_especiais?: string;
  pediatra_referencia?: string;
  altura?: number;
  peso?: number;
  tipo_sanguineo?: string;
  alergias?: string;
  doencas_cronicas?: string;
  medicacoes_continuo?: string;
  cirurgias_previas?: string;
  historico_familiar?: string;
  vacinas?: VacinaDTO[];
  observacoes?: string;
  atividade_fisica_frequencia?: string;
  atividade_fisica_tipo?: string;
  alimentacao?: string;
  sono_horas?: number;
  profissional_responsavel?: string;
  status: string;
  deleted_at?: string;
  consentimento_lgpd: boolean;
  autorizacao_uso_imagem: boolean;
  assinatura_digital?: string;
  documentos_anexos?: DocumentoAnexoDTO[];
  unidades?: PacienteUnidadeDTO[];
  ultima_consulta_em?: string;
  proxima_consulta_em?: string;
  total_consultas?: number;
  created_at: string;
  updated_at: string;
}

export interface UnidadeLinkPayload {
  unidade_id: string;
  principal: boolean;
}

export type CreatePacientePayload = Omit<
  PacienteDTO,
  'id' | 'created_at' | 'updated_at' | 'unidades'
> & {
  unidade_ids: UnidadeLinkPayload[];
};

export type UpdatePacientePayload = CreatePacientePayload;

export interface ListPacientesParams {
  unidade_id?: string;
  q?: string;
  cpf?: string;
  status?: string;
  include_deleted?: boolean;
  page?: number;
  page_size?: number;
}
