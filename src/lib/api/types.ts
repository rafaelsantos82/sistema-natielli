export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details: ApiErrorDetail[];
}

export interface ApiErrorEnvelope {
  error: ApiErrorBody;
}

export interface ApiSuccessEnvelope<T> {
  data: T;
  meta: unknown;
}

export interface ListMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface AuthTokenData {
  access_token: string;
  token_type: string;
  expires_in: string;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  paciente_id?: string;
  profissional_id?: string;
  unidade_ids: string[];
  permissions?: string[];
  must_change_password?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface AuthLoginData {
  access_token: string;
  token_type: string;
  expires_in: string;
  user: UserDTO;
}

export interface AuthMeData {
  id: string;
  name: string;
  email: string;
  role: string;
  paciente_id?: string;
  profissional_id?: string;
  unidade_ids: string[];
  permissions?: string[];
  must_change_password?: boolean;
}
