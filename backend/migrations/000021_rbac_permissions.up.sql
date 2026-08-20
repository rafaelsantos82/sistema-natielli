CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role user_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role, permission_id)
);

INSERT INTO permissions (code, resource, action, description) VALUES
  ('api.pacientes.read', 'pacientes', 'read', 'Ler pacientes'),
  ('api.pacientes.write', 'pacientes', 'write', 'Criar e atualizar pacientes'),
  ('api.pacientes.delete', 'pacientes', 'delete', 'Excluir pacientes'),
  ('api.unidades.read', 'unidades', 'read', 'Ler unidades'),
  ('api.profissionais.read', 'profissionais', 'read', 'Ler profissionais'),
  ('api.profissionais.write', 'profissionais', 'write', 'Criar e atualizar profissionais'),
  ('api.profissionais.delete', 'profissionais', 'delete', 'Excluir profissionais'),
  ('api.consultas.read', 'consultas', 'read', 'Ler consultas'),
  ('api.consultas.write', 'consultas', 'write', 'Criar e atualizar consultas'),
  ('api.consultas.delete', 'consultas', 'delete', 'Excluir consultas'),
  ('api.salas.read', 'salas', 'read', 'Ler salas'),
  ('api.salas.write', 'salas', 'write', 'Criar e atualizar salas'),
  ('api.salas.delete', 'salas', 'delete', 'Excluir salas'),
  ('api.notification-settings.read', 'notification-settings', 'read', 'Ler configurações de notificação'),
  ('api.notification-settings.write', 'notification-settings', 'write', 'Gerenciar configurações de notificação'),
  ('api.tratamentos.read', 'tratamentos', 'read', 'Ler tratamentos'),
  ('api.tratamentos.write', 'tratamentos', 'write', 'Criar e atualizar tratamentos'),
  ('api.tratamentos.delete', 'tratamentos', 'delete', 'Excluir tratamentos'),
  ('api.anamneses.read', 'anamneses', 'read', 'Ler anamneses'),
  ('api.anamneses.write', 'anamneses', 'write', 'Criar e atualizar anamneses'),
  ('api.anamneses.delete', 'anamneses', 'delete', 'Excluir anamneses'),
  ('api.prontuario.read', 'prontuario', 'read', 'Ler prontuário'),
  ('api.prontuario.write', 'prontuario', 'write', 'Criar e atualizar prontuário'),
  ('api.prontuario.delete', 'prontuario', 'delete', 'Excluir prontuário'),
  ('api.financeiro.read', 'financeiro', 'read', 'Ler módulo financeiro'),
  ('api.financeiro.write', 'financeiro', 'write', 'Criar e atualizar módulo financeiro'),
  ('api.financeiro.delete', 'financeiro', 'delete', 'Excluir registros financeiros'),
  ('api.relatorios-operacionais.read', 'relatorios-operacionais', 'read', 'Ler relatórios operacionais'),
  ('api.relatorios-operacionais.write', 'relatorios-operacionais', 'write', 'Criar e atualizar relatórios operacionais'),
  ('api.relatorios-operacionais.delete', 'relatorios-operacionais', 'delete', 'Excluir relatórios operacionais'),
  ('api.rh.read', 'rh', 'read', 'Ler RH'),
  ('api.rh.write', 'rh', 'write', 'Criar e atualizar RH'),
  ('api.rh.delete', 'rh', 'delete', 'Excluir RH'),
  ('api.estoque.read', 'estoque', 'read', 'Ler estoque'),
  ('api.estoque.write', 'estoque', 'write', 'Criar e atualizar estoque'),
  ('api.estoque.delete', 'estoque', 'delete', 'Excluir estoque'),
  ('api.comodatos.read', 'comodatos', 'read', 'Ler comodatos'),
  ('api.comodatos.write', 'comodatos', 'write', 'Criar e atualizar comodatos'),
  ('api.comodatos.delete', 'comodatos', 'delete', 'Excluir comodatos'),
  ('api.planos.read', 'planos', 'read', 'Ler planos'),
  ('api.planos.write', 'planos', 'write', 'Criar e atualizar planos'),
  ('api.planos.delete', 'planos', 'delete', 'Excluir planos'),
  ('api.contratos.read', 'contratos', 'read', 'Ler contratos'),
  ('api.contratos.write', 'contratos', 'write', 'Criar e atualizar contratos'),
  ('api.contratos.delete', 'contratos', 'delete', 'Excluir contratos'),
  ('api.marketing.read', 'marketing', 'read', 'Ler marketing'),
  ('api.marketing.write', 'marketing', 'write', 'Criar e atualizar marketing'),
  ('api.marketing.delete', 'marketing', 'delete', 'Excluir marketing'),
  ('api.contabilidade.read', 'contabilidade', 'read', 'Ler contabilidade'),
  ('api.contabilidade.write', 'contabilidade', 'write', 'Criar e atualizar contabilidade'),
  ('api.contabilidade.delete', 'contabilidade', 'delete', 'Excluir contabilidade'),
  ('api.audit.read', 'audit', 'read', 'Ler auditoria'),
  ('api.users.manage', 'users', 'manage', 'Gerenciar usuários'),
  ('api.access-control.manage', 'access-control', 'manage', 'Gerenciar controle de acesso'),
  ('menu.agenda.view', 'menu.agenda', 'view', 'Ver menu Agenda'),
  ('menu.consultas.view', 'menu.consultas', 'view', 'Ver menu Agendamentos'),
  ('menu.pacientes.view', 'menu.pacientes', 'view', 'Ver menu Pacientes'),
  ('menu.tratamentos.view', 'menu.tratamentos', 'view', 'Ver menu Tratamentos'),
  ('menu.salas.view', 'menu.salas', 'view', 'Ver menu Salas de Atendimento'),
  ('menu.prontuarios.view', 'menu.prontuarios', 'view', 'Ver menu Prontuários'),
  ('menu.anamneses.view', 'menu.anamneses', 'view', 'Ver menu Anamneses'),
  ('menu.aprovacoes.view', 'menu.aprovacoes', 'view', 'Ver menu Aprovação Atendimentos'),
  ('menu.docs-assinados.view', 'menu.docs-assinados', 'view', 'Ver menu Docs Assinados'),
  ('menu.meu-painel.view', 'menu.meu-painel', 'view', 'Ver menu Meu Painel'),
  ('menu.minha-agenda.view', 'menu.minha-agenda', 'view', 'Ver menu Minha Agenda'),
  ('menu.profissionais.view', 'menu.profissionais', 'view', 'Ver menu Profissionais'),
  ('menu.financeiro.view', 'menu.financeiro', 'view', 'Ver menu Financeiro'),
  ('menu.balancetes.view', 'menu.balancetes', 'view', 'Ver menu Balancetes'),
  ('menu.relatorios-conciliacao.view', 'menu.relatorios-conciliacao', 'view', 'Ver menu Relatórios Conciliação'),
  ('menu.auditoria-notas.view', 'menu.auditoria-notas', 'view', 'Ver menu Auditoria de Notas'),
  ('menu.contratos.view', 'menu.contratos', 'view', 'Ver menu Contratos'),
  ('menu.folha-pagamento.view', 'menu.folha-pagamento', 'view', 'Ver menu Folha de Pagamento'),
  ('menu.planos-saude.view', 'menu.planos-saude', 'view', 'Ver menu Planos de Saúde'),
  ('menu.acoes-judiciais.view', 'menu.acoes-judiciais', 'view', 'Ver menu Ações Judiciais'),
  ('menu.estoque.view', 'menu.estoque', 'view', 'Ver menu Estoque'),
  ('menu.comodato.view', 'menu.comodato', 'view', 'Ver menu Comodato'),
  ('menu.relatorios.view', 'menu.relatorios', 'view', 'Ver menu Relatórios'),
  ('menu.relatorios-avancados.view', 'menu.relatorios-avancados', 'view', 'Ver menu Relatórios Avançados'),
  ('menu.marketing.view', 'menu.marketing', 'view', 'Ver menu Marketing'),
  ('menu.documentos.view', 'menu.documentos', 'view', 'Ver menu Documentos'),
  ('menu.unidades.view', 'menu.unidades', 'view', 'Ver menu Unidades'),
  ('menu.configuracoes.usuarios.view', 'menu.configuracoes.usuarios', 'view', 'Ver menu Usuários'),
  ('menu.configuracoes.acessos.view', 'menu.configuracoes.acessos', 'view', 'Ver menu Controles de Acesso')
ON CONFLICT (code) DO NOTHING;

WITH selected_permissions AS (
  SELECT id, code
  FROM permissions
),
role_map AS (
  SELECT 'admin'::user_role AS role, code FROM selected_permissions
  UNION ALL
  SELECT 'gestor'::user_role, code FROM selected_permissions
  WHERE code NOT IN (
    'api.users.manage',
    'api.access-control.manage',
    'api.audit.read',
    'menu.configuracoes.usuarios.view',
    'menu.configuracoes.acessos.view'
  )
  UNION ALL
  SELECT 'funcionario'::user_role, code FROM selected_permissions
  WHERE (
    code LIKE 'api.%.read'
    OR code LIKE 'api.%.write'
    OR code LIKE 'menu.%'
  )
  AND code NOT IN (
    'api.users.manage',
    'api.access-control.manage',
    'api.audit.read',
    'api.profissionais.delete',
    'api.notification-settings.write',
    'api.financeiro.write',
    'api.financeiro.delete',
    'api.rh.read',
    'api.rh.write',
    'api.rh.delete',
    'api.contabilidade.read',
    'api.contabilidade.write',
    'api.contabilidade.delete',
    'api.marketing.read',
    'api.marketing.write',
    'api.marketing.delete',
    'api.planos.read',
    'api.planos.write',
    'api.planos.delete',
    'api.contratos.delete',
    'api.contratos.write',
    'menu.financeiro.view',
    'menu.balancetes.view',
    'menu.relatorios-conciliacao.view',
    'menu.auditoria-notas.view',
    'menu.folha-pagamento.view',
    'menu.marketing.view',
    'menu.planos-saude.view',
    'menu.acoes-judiciais.view',
    'menu.unidades.view',
    'menu.profissionais.view',
    'menu.configuracoes.usuarios.view',
    'menu.configuracoes.acessos.view'
  )
  UNION ALL
  SELECT 'terceiro'::user_role, code FROM selected_permissions
  WHERE (
    code LIKE 'api.%.read'
    OR code LIKE 'menu.%'
  )
  AND code NOT IN (
    'api.users.manage',
    'api.access-control.manage',
    'api.audit.read',
    'api.notification-settings.read',
    'api.profissionais.write',
    'api.profissionais.delete',
    'api.consultas.write',
    'api.consultas.delete',
    'api.pacientes.write',
    'api.pacientes.delete',
    'api.salas.write',
    'api.salas.delete',
    'api.tratamentos.write',
    'api.tratamentos.delete',
    'api.anamneses.write',
    'api.anamneses.delete',
    'api.prontuario.write',
    'api.prontuario.delete',
    'api.financeiro.write',
    'api.financeiro.delete',
    'api.relatorios-operacionais.write',
    'api.relatorios-operacionais.delete',
    'api.estoque.write',
    'api.estoque.delete',
    'api.comodatos.write',
    'api.comodatos.delete',
    'api.planos.write',
    'api.planos.delete',
    'api.contratos.write',
    'api.contratos.delete',
    'api.marketing.write',
    'api.marketing.delete',
    'api.contabilidade.write',
    'api.contabilidade.delete',
    'api.rh.write',
    'api.rh.delete',
    'menu.agenda.view',
    'menu.consultas.view',
    'menu.pacientes.view',
    'menu.tratamentos.view',
    'menu.salas.view',
    'menu.prontuarios.view',
    'menu.anamneses.view',
    'menu.aprovacoes.view',
    'menu.docs-assinados.view',
    'menu.meu-painel.view',
    'menu.minha-agenda.view',
    'menu.profissionais.view',
    'menu.estoque.view',
    'menu.comodato.view',
    'menu.marketing.view',
    'menu.unidades.view',
    'menu.configuracoes.usuarios.view',
    'menu.configuracoes.acessos.view'
  )
)
INSERT INTO role_permissions (role, permission_id)
SELECT rm.role, sp.id
FROM role_map rm
JOIN selected_permissions sp ON sp.code = rm.code
ON CONFLICT (role, permission_id) DO NOTHING;
