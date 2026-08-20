/** Flags de integração API — default ligado em dev; use `false` só em CI sem backend. */
const enabled = (key: string) => import.meta.env[key] !== 'false';

export const featureFlags = {
  pacientesApiEnabled: enabled('VITE_API_PACIENTES'),
  profissionaisApiEnabled: enabled('VITE_API_PROFISSIONAIS'),
  consultasApiEnabled: enabled('VITE_API_CONSULTAS'),
  salasApiEnabled: enabled('VITE_API_SALAS'),
  unidadesApiEnabled: enabled('VITE_API_UNIDADES'),
  financeiroApiEnabled: enabled('VITE_API_FINANCEIRO'),
  terapiasApiEnabled: enabled('VITE_API_TERAPIAS'),
  anamnesesApiEnabled: enabled('VITE_API_ANAMNESES'),
  prontuarioApiEnabled: enabled('VITE_API_PRONTUARIO'),
  relatoriosApiEnabled: enabled('VITE_API_RELATORIOS'),
  estoqueApiEnabled: enabled('VITE_API_ESTOQUE'),
  rhApiEnabled: enabled('VITE_API_RH'),
  planosApiEnabled: enabled('VITE_API_PLANOS'),
  marketingApiEnabled: enabled('VITE_API_MARKETING'),
  contabilidadeApiEnabled: enabled('VITE_API_CONTABILIDADE'),
  comodatoApiEnabled: enabled('VITE_API_COMODATO'),
  contratosApiEnabled: enabled('VITE_API_CONTRATOS'),
  auditApiEnabled: enabled('VITE_API_AUDIT'),
  documentosApiEnabled: enabled('VITE_API_DOCUMENTOS'),
  chaveDigitalApiEnabled: enabled('VITE_API_CHAVE_DIGITAL'),
  documentosAssinadosApiEnabled: enabled('VITE_API_DOCUMENTOS_ASSINADOS'),
  authBootstrapEnabled: import.meta.env.VITE_AUTH_BOOTSTRAP === 'true',
  authLoginEnabled: import.meta.env.VITE_AUTH_LOGIN !== 'false',
} as const;
