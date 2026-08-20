import type { ListMeta } from '@/lib/api/types';

export interface DocumentoCategoriaDTO {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface BibliotecaArquivoDTO {
  id: string;
  categoria_id: string;
  categoria_nome: string;
  titulo: string;
  nome_arquivo: string;
  mime_type: string;
  tamanho_bytes: number;
  uploaded_at: string;
  uploaded_by: string;
  uploaded_by_nome?: string;
}

export interface ListBibliotecaArquivosParams {
  categoria_id?: string;
  q?: string;
  page?: number;
  page_size?: number;
}

export interface ListDocumentoCategoriasParams {
  include_inativas?: boolean;
}

export type CreateCategoriaPayload = {
  nome: string;
  descricao?: string;
  ordem?: number;
  ativo?: boolean;
};

export type UpdateCategoriaPayload = CreateCategoriaPayload;

export type { ListMeta };
