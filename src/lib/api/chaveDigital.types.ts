export interface ChaveDigitalDTO {
  id: string;
  unidade_id: string;
  signer_common_name: string;
  signer_org?: string;
  signer_cpf?: string;
  cert_valid_from: string;
  cert_valid_to: string;
  cert_issuer: string;
  cert_serial: string;
  algoritmo: string;
  is_icp_brasil: boolean;
  is_valid: boolean;
}
