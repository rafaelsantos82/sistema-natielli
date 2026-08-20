import { useMemo, type ReactNode } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Shield, User } from 'lucide-react';
import { ReadOnlyField } from '@/components/common/ReadOnlyField';
import type { PacienteFormData } from '@/lib/validations/paciente.schema';
import { formatDateBr } from '@/lib/mappers/pacienteMapper';
import { formatCPF, formatCEP } from '@/lib/utils/validators';
import type { DocumentoAnexoDTO, VacinaDTO } from '@/lib/api/pacientes.types';

const SEXO_LABELS: Record<string, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  intersexo: 'Intersexo',
};

const STATUS_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  falecido: 'Falecido',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts[0]?.[0]) return parts[0].slice(0, 2).toUpperCase();
  return 'PA';
}

function simNao(value?: boolean): string {
  if (value === true) return 'Sim';
  if (value === false) return 'Não';
  return '';
}

function displayText(value?: string | null): string | undefined {
  const t = value?.trim();
  return t || undefined;
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

export interface PacienteDetalheExtras {
  profissional_responsavel?: string;
  vacinas?: VacinaDTO[];
  documentos_anexos?: DocumentoAnexoDTO[];
  proximaConsulta?: string;
  ultimaConsulta?: string;
  totalConsultas?: number;
}

interface Props {
  data: PacienteFormData;
  extras?: PacienteDetalheExtras;
}

export const PacienteDetalheView = ({ data, extras }: Props) => {
  const nomeExibicao = displayText(data.nome_social) || data.nome_completo;
  const avatarLetters = useMemo(() => initials(data.nome_completo), [data.nome_completo]);

  const cpfDisplay = data.cpf ? formatCPF(data.cpf) : undefined;
  const respCpfDisplay = data.responsavel_cpf ? formatCPF(data.responsavel_cpf) : undefined;
  const nascimentoDisplay = data.data_nascimento ? formatDateBr(data.data_nascimento) : undefined;
  const cepDisplay = data.cep ? formatCEP(data.cep) : undefined;

  const enderecoLinha = [data.endereco, data.numero, data.complemento].filter(displayText).join(', ');

  const imc =
    data.altura && data.peso
      ? (data.peso / (data.altura / 100) ** 2).toFixed(1)
      : undefined;

  const pessoasBusca = data.pessoas_autorizadas_busca?.filter((p) => p.trim()) ?? [];
  const vacinas = extras?.vacinas ?? data.vacinas ?? [];
  const documentos = extras?.documentos_anexos ?? data.documentos_anexos ?? [];

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
              <h2 className="truncate text-xl font-semibold text-navy sm:text-2xl">{nomeExibicao}</h2>
              {data.nome_social?.trim() && data.nome_social !== data.nome_completo && (
                <p className="truncate text-sm text-muted-foreground">
                  Nome civil: {data.nome_completo}
                </p>
              )}
              <p className="flex items-center gap-2 truncate text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span className="truncate">{data.tel_principal}</span>
              </p>
              {data.email?.trim() && (
                <p className="flex items-center gap-2 truncate text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{data.email}</span>
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={data.status === 'ativo' ? 'default' : 'secondary'}
                  className={
                    data.status === 'ativo' ? 'bg-success text-success-foreground' : ''
                  }
                >
                  {STATUS_LABELS[data.status] ?? data.status}
                </Badge>
                {nascimentoDisplay && (
                  <Badge variant="outline" className="text-xs">
                    Nasc. {nascimentoDisplay}
                  </Badge>
                )}
              </div>
              {(extras?.proximaConsulta ||
                extras?.ultimaConsulta ||
                extras?.totalConsultas != null) && (
                <div className="grid grid-cols-1 gap-1 pt-1 text-xs text-muted-foreground sm:grid-cols-3">
                  {extras.proximaConsulta && (
                    <span>Próxima: {extras.proximaConsulta}</span>
                  )}
                  {extras.ultimaConsulta && (
                    <span>Última: {extras.ultimaConsulta}</span>
                  )}
                  {extras.totalConsultas != null && (
                    <span>Consultas: {extras.totalConsultas}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <DetalheSection title="Identificação">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField label="Nome completo" value={data.nome_completo} className="sm:col-span-2" />
          <ReadOnlyField label="Nome social" value={displayText(data.nome_social)} />
          <ReadOnlyField label="Data de nascimento" value={nascimentoDisplay} />
          <ReadOnlyField
            label="Sexo biológico"
            value={SEXO_LABELS[data.sexo_biologico] ?? data.sexo_biologico}
          />
          <ReadOnlyField label="CPF" value={cpfDisplay} />
          <ReadOnlyField label="RG" value={displayText(data.rg_numero)} />
          <ReadOnlyField label="Órgão emissor" value={displayText(data.rg_orgao)} />
        </div>
      </DetalheSection>

      <DetalheSection title="Endereço e contato">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField label="Telefone principal" value={data.tel_principal} />
          <ReadOnlyField label="Telefone secundário" value={displayText(data.tel_secundario)} />
          <ReadOnlyField label="E-mail" value={displayText(data.email)} className="sm:col-span-2" />
          <ReadOnlyField label="CEP" value={cepDisplay} />
          <ReadOnlyField label="Bairro" value={displayText(data.bairro)} />
          <ReadOnlyField label="Endereço" value={enderecoLinha || undefined} className="sm:col-span-2" />
          <ReadOnlyField
            label="Cidade / UF"
            value={[displayText(data.cidade), data.uf].filter(Boolean).join(' / ') || undefined}
          />
          <ReadOnlyField label="Contato de emergência (nome)" value={displayText(data.contato_emergencia_nome)} />
          <ReadOnlyField label="Contato de emergência (telefone)" value={displayText(data.contato_emergencia_tel)} />
        </div>
      </DetalheSection>

      <DetalheSection title="Responsável legal">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField label="Nome" value={data.responsavel_nome} className="sm:col-span-2" />
          <ReadOnlyField label="CPF" value={respCpfDisplay} />
          <ReadOnlyField label="Parentesco" value={displayText(data.responsavel_parentesco)} />
          <ReadOnlyField label="Telefone" value={displayText(data.responsavel_tel)} />
          <ReadOnlyField label="E-mail" value={displayText(data.responsavel_email)} />
        </div>
      </DetalheSection>

      <DetalheSection title="Contexto familiar">
        {pessoasBusca.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma pessoa autorizada para busca cadastrada.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {pessoasBusca.map((pessoa, idx) => (
              <li key={`${pessoa}-${idx}`} className="p-3 text-sm">
                {pessoa}
              </li>
            ))}
          </ul>
        )}
      </DetalheSection>

      <DetalheSection title="Escola e desenvolvimento">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField label="Escola" value={displayText(data.escola)} />
          <ReadOnlyField label="Série/Ano" value={displayText(data.serie_ano)} />
          <ReadOnlyField
            label="Necessidades especiais"
            value={displayText(data.necessidades_especiais)}
            className="sm:col-span-2"
          />
          <ReadOnlyField
            label="Pediatra de referência"
            value={displayText(data.pediatra_referencia)}
            className="sm:col-span-2"
          />
        </div>
      </DetalheSection>

      <DetalheSection title="Saúde e histórico médico">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ReadOnlyField label="Altura" value={data.altura != null ? `${data.altura} cm` : undefined} />
          <ReadOnlyField label="Peso" value={data.peso != null ? `${data.peso} kg` : undefined} />
          <ReadOnlyField label="IMC" value={imc} />
          <ReadOnlyField label="Tipo sanguíneo" value={data.tipo_sanguineo} />
          <ReadOnlyField label="Alergias" value={displayText(data.alergias)} className="sm:col-span-3" />
          <ReadOnlyField
            label="Doenças crônicas"
            value={displayText(data.doencas_cronicas)}
            className="sm:col-span-3"
          />
          <ReadOnlyField
            label="Medicações de uso contínuo"
            value={displayText(data.medicacoes_continuo)}
            className="sm:col-span-3"
          />
          <ReadOnlyField
            label="Cirurgias prévias"
            value={displayText(data.cirurgias_previas)}
            className="sm:col-span-3"
          />
          <ReadOnlyField
            label="Histórico familiar"
            value={displayText(data.historico_familiar)}
            className="sm:col-span-3"
          />
        </div>
      </DetalheSection>

      <DetalheSection title="Hábitos e rotina">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField
            label="Frequência de atividade física"
            value={displayText(data.atividade_fisica_frequencia)}
          />
          <ReadOnlyField
            label="Tipo de atividade física"
            value={displayText(data.atividade_fisica_tipo)}
          />
          <ReadOnlyField label="Alimentação" value={displayText(data.alimentacao)} />
          <ReadOnlyField
            label="Horas de sono"
            value={data.sono_horas != null ? `${data.sono_horas} h` : undefined}
          />
        </div>
      </DetalheSection>

      <DetalheSection
        title={
          <span className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Terapia e acompanhamento
          </span>
        }
      >
        <ReadOnlyField
          label="Profissional responsável"
          value={displayText(extras?.profissional_responsavel)}
        />
      </DetalheSection>

      <DetalheSection
        title={
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Consentimento e autorizações
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField label="Consentimento LGPD" value={simNao(data.consentimento_lgpd)} />
          <ReadOnlyField label="Autorização de uso de imagem" value={simNao(data.autorizacao_uso_imagem)} />
          <ReadOnlyField
            label="Assinatura digital"
            value={displayText(data.assinatura_digital)}
            className="sm:col-span-2"
          />
        </div>
      </DetalheSection>

      <DetalheSection title="Status e observações">
        <div className="grid grid-cols-1 gap-3">
          <ReadOnlyField label="Status" value={STATUS_LABELS[data.status] ?? data.status} />
          <ReadOnlyField label="Observações" value={displayText(data.observacoes)} />
        </div>
      </DetalheSection>

      {vacinas.length > 0 && (
        <DetalheSection title="Vacinas">
          <ul className="divide-y rounded-md border">
            {vacinas.map((v, idx) => (
              <li key={`${v.tipo}-${v.data}-${idx}`} className="flex flex-wrap gap-2 p-3 text-sm">
                <span className="font-medium">{v.tipo}</span>
                <span className="text-muted-foreground">
                  {v.data ? formatDateBr(v.data.split('T')[0]) : '—'}
                </span>
              </li>
            ))}
          </ul>
        </DetalheSection>
      )}

      {documentos.length > 0 && (
        <DetalheSection title="Documentos anexos">
          <ul className="divide-y rounded-md border">
            {documentos.map((doc, idx) => (
              <li key={`${doc.tipo}-${idx}`} className="space-y-1 p-3 text-sm">
                <p className="font-medium">{doc.tipo}</p>
                <p className="truncate text-muted-foreground" title={doc.arquivo}>
                  {doc.arquivo}
                </p>
                {doc.descricao?.trim() && (
                  <p className="text-xs text-muted-foreground">{doc.descricao}</p>
                )}
              </li>
            ))}
          </ul>
        </DetalheSection>
      )}
    </div>
  );
};
