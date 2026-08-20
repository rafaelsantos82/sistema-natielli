export type DocumentoAssinadoType = 'prontuario' | 'prescricao' | 'atestado';

export interface DocumentoAssinadoDTO {
  id: string;
  name: string;
  type: DocumentoAssinadoType;
  document_hash: string;
  signed_at: string;
  algorithm: string;
  signer_common_name: string;
  signer_org?: string;
  cert_valid_to: string;
  cert_issuer: string;
  unidade_id: string;
}

export interface VerifyAssinaturaResult {
  valid: boolean;
  message: string;
}

export interface ListDocumentosAssinadosMeta {
  total?: number;
  page?: number;
  page_size?: number;
}
