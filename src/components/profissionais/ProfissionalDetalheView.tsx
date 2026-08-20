import { useMemo, type ReactNode } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Shield, Star } from 'lucide-react';
import { ReadOnlyField } from '@/components/common/ReadOnlyField';
import { ProfissionalDocumentosLista } from '@/components/profissionais/ProfissionalDocumentosLista';
import type { Profissional } from '@/hooks/useProfissionais';
import { useProfissionalConselhos } from '@/hooks/useProfissionalConselhos';
import { formatDateBr } from '@/lib/mappers/pacienteMapper';
import { formatCPF, formatCEP } from '@/lib/utils/validators';

const DIA_LABELS: Record<string, string> = {
  domingo: 'Domingo',
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado',
  dom: 'Domingo',
  seg: 'Segunda-feira',
  ter: 'Terça-feira',
  qua: 'Quarta-feira',
  qui: 'Quinta-feira',
  sex: 'Sexta-feira',
  sab: 'Sábado',
};

const CONSELHO_LABELS: Record<string, string> = {
  CRP: 'CRP - Psicologia',
  CRM: 'CRM - Medicina',
  CREFITO: 'CREFITO - Fisioterapia',
  COREN: 'COREN - Enfermagem',
  CRN: 'CRN - Nutrição',
  CREFONO: 'CREFONO - Fonoaudiologia',
  CRO: 'CRO - Odontologia',
  CRBM: 'CRBM - Biomedicina',
  OUTRO: 'Outro',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts[0]?.[0]) return parts[0].slice(0, 2).toUpperCase();
  return 'PR';
}

function formatDiaLabel(dia: string): string {
  return DIA_LABELS[dia] ?? dia;
}

function simNao(value?: boolean): string {
  if (value === true) return 'Sim';
  if (value === false) return 'Não';
  return '';
}

interface Props {
  profissional: Profissional;
}

interface DetalheSectionProps {
  title: ReactNode;
  children: ReactNode;
}

const DetalheSection = ({ title, children }: DetalheSectionProps) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export const ProfissionalDetalheView = ({ profissional }: Props) => {
  const { listByProfissional } = useProfissionalConselhos();
  const conselhos = listByProfissional(profissional.id);

  const avatarLetters = useMemo(() => initials(profissional.nome), [profissional.nome]);

  const cpfDisplay = profissional.cpf ? formatCPF(profissional.cpf) : undefined;
  const nascimentoDisplay = profissional.dataNascimento
    ? formatDateBr(profissional.dataNascimento)
    : undefined;
  const cepDisplay = profissional.cep ? formatCEP(profissional.cep) : undefined;

  const conselhoPrincipal = [
    profissional.conselho ? (CONSELHO_LABELS[profissional.conselho] ?? profissional.conselho) : '',
    profissional.numeroRegistro,
    profissional.ufRegistro,
  ]
    .filter(Boolean)
    .join(' · ');

  const diasAgenda = (profissional.diasAtendimento ?? [])
    .map(formatDiaLabel)
    .join(', ');

  const enderecoLinha = [
    profissional.logradouro,
    profissional.numero,
    profissional.complemento,
  ]
    .filter(Boolean)
    .join(', ');

  const cidadeUf = [profissional.cidade, profissional.uf].filter(Boolean).join(' / ');

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-0 shadow-none">
        <div className="rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Avatar className="h-16 w-16 shrink-0 border-2 border-background shadow-sm sm:h-20 sm:w-20">
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground sm:text-xl">
                {avatarLetters}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="truncate text-xl font-semibold text-navy sm:text-2xl">
                {profissional.nome}
              </h2>
              <p className="flex items-center gap-2 truncate text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{profissional.email}</span>
              </p>
              {conselhoPrincipal && (
                <p className="text-sm text-muted-foreground">{conselhoPrincipal}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={profissional.status === 'ativo' ? 'default' : 'secondary'}
                  className={
                    profissional.status === 'ativo'
                      ? 'bg-success text-success-foreground'
                      : ''
                  }
                >
                  {profissional.status}
                </Badge>
                {(profissional.especialidades ?? []).slice(0, 3).map((esp) => (
                  <Badge key={esp} variant="outline" className="text-xs">
                    {esp}
                  </Badge>
                ))}
                {(profissional.especialidades?.length ?? 0) > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{(profissional.especialidades?.length ?? 0) - 3}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <DetalheSection title="Identificação">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField label="Nome completo" value={profissional.nome} className="sm:col-span-2" />
          <ReadOnlyField label="CPF" value={cpfDisplay} />
          <ReadOnlyField label="RG" value={profissional.rg} />
          <ReadOnlyField label="Data de nascimento" value={nascimentoDisplay} />
          <ReadOnlyField label="E-mail" value={profissional.email} />
          <ReadOnlyField label="Telefone" value={profissional.telefone} />
          <ReadOnlyField label="Celular" value={profissional.celular} />
        </div>
      </DetalheSection>

      <DetalheSection title="Registro profissional">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ReadOnlyField
            label="Conselho"
            value={
              profissional.conselho
                ? (CONSELHO_LABELS[profissional.conselho] ?? profissional.conselho)
                : undefined
            }
          />
          <ReadOnlyField label="Número" value={profissional.numeroRegistro} />
          <ReadOnlyField label="UF" value={profissional.ufRegistro} />
        </div>
      </DetalheSection>

      <DetalheSection
        title={
          <span className="flex items-center gap-2">
            Conselhos adicionais
            {conselhos.length > 0 && <Badge variant="secondary">{conselhos.length}</Badge>}
          </span>
        }
      >
        {conselhos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum conselho adicional cadastrado.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {conselhos.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                <span className="font-medium">
                  {CONSELHO_LABELS[c.tipo] ?? c.tipo} {c.numero}/{c.uf}
                </span>
                {c.validade && (
                  <span className="text-muted-foreground">
                    Validade: {formatDateBr(c.validade.split('T')[0])}
                  </span>
                )}
                {c.principal && (
                  <Badge variant="default" className="gap-1">
                    <Star className="h-3 w-3" />
                    Principal
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </DetalheSection>

      <DetalheSection title="Endereço">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField label="CEP" value={cepDisplay} />
          <ReadOnlyField label="Bairro" value={profissional.bairro} />
          <ReadOnlyField label="Logradouro" value={enderecoLinha || undefined} className="sm:col-span-2" />
          <ReadOnlyField label="Cidade / UF" value={cidadeUf || undefined} />
        </div>
      </DetalheSection>

      <DetalheSection title="Especialidades">
        <div className="flex flex-wrap gap-2">
          {(profissional.especialidades ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma especialidade cadastrada.</p>
          ) : (
            profissional.especialidades!.map((esp) => (
              <Badge key={esp} variant="outline">
                {esp}
              </Badge>
            ))
          )}
        </div>
      </DetalheSection>

      <DetalheSection title="Agenda">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField label="Dias de atendimento" value={diasAgenda || undefined} className="sm:col-span-2" />
          <ReadOnlyField label="Horário início" value={profissional.horarioInicio} />
          <ReadOnlyField label="Horário fim" value={profissional.horarioFim} />
          <ReadOnlyField
            label="Duração da consulta"
            value={profissional.duracaoConsulta != null ? `${profissional.duracaoConsulta} min` : undefined}
          />
        </div>
      </DetalheSection>

      <DetalheSection
        title={
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            LGPD
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField label="Consentimento LGPD" value={simNao(profissional.consentimentoLGPD)} />
          <ReadOnlyField
            label="Data do consentimento"
            value={
              profissional.dataConsentimento
                ? formatDateBr(profissional.dataConsentimento.split('T')[0])
                : undefined
            }
          />
          <ReadOnlyField label="Compartilhamento de dados" value={simNao(profissional.compartilhamentoDados)} />
          <ReadOnlyField
            label="Finalidade dos dados"
            value={profissional.finalidadeDados}
            className="sm:col-span-2"
          />
        </div>
      </DetalheSection>

      <DetalheSection title="Administrativo">
        <div className="grid grid-cols-1 gap-3">
          <ReadOnlyField label="Observações" value={profissional.observacoes} />
        </div>
      </DetalheSection>

      <DetalheSection title="Documentos">
        <ProfissionalDocumentosLista profissionalId={profissional.id} />
      </DetalheSection>
    </div>
  );
};
