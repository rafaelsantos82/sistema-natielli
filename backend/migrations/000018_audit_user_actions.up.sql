ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'usuario.criacao';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'usuario.edicao';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'usuario.exclusao';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'usuario.login';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'usuario.logout';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'usuario.reset_senha_solicitado';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'usuario.reset_senha_concluido';
ALTER TYPE audit_acao ADD VALUE IF NOT EXISTS 'usuario.senha_alterada';
