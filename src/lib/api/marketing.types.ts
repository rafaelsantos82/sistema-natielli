export type ManualDTO = {
  id: string;
  titulo: string;
  versao: string;
  publico_alvo: string;
  arquivo_url: string;
  arquivo_nome: string;
  tags?: string[];
  status: string;
  observacoes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type MaterialMarketingDTO = {
  id: string;
  titulo: string;
  tipo: string;
  arquivo_url: string;
  arquivo_nome: string;
  tags?: string[];
  campanha?: string | null;
  unidade_id?: string | null;
  status: string;
  observacoes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ManualUploadInput = {
  titulo: string;
  versao: string;
  publico_alvo: 'Interno' | 'Externo' | 'Ambos';
  file: File;
  tags?: string[];
  status?: string;
  observacoes?: string;
};

export type MaterialUploadInput = {
  titulo: string;
  tipo: string;
  file: File;
  tags?: string[];
  campanha?: string;
  unidade_id?: string;
  status?: string;
  observacoes?: string;
};
