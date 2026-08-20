import { type ReactNode, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { ReadOnlyField } from '@/components/common/ReadOnlyField';
import type { Sala } from '@/hooks/useSalas';

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

interface Props {
  sala: Sala;
}

function formatDateTime(value?: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('pt-BR');
}

export const SalaDetalheView = ({ sala }: Props) => {
  const recursos = sala.recursos ?? [];
  const especialidades = sala.especialidade_atendida ?? [];
  const initials = useMemo(
    () =>
      sala.nome_sala
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((v) => v[0]?.toUpperCase() ?? '')
        .join('') || 'SA',
    [sala.nome_sala],
  );

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-0 shadow-none">
        <div className="rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-background bg-primary text-lg font-semibold text-primary-foreground shadow-sm sm:h-20 sm:w-20 sm:text-xl">
              {initials}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="truncate text-xl font-semibold text-navy sm:text-2xl">
                {sala.nome_sala}
              </h2>
              <p className="flex items-center gap-2 truncate text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="truncate">{sala.unidade || 'Unidade não informada'}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={sala.status === 'Ativa' ? 'default' : 'secondary'}
                  className={sala.status === 'Ativa' ? 'bg-success text-success-foreground' : ''}
                >
                  {sala.status}
                </Badge>
                {sala.codigo && (
                  <Badge variant="outline" className="text-xs">
                    Código: {sala.codigo}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <DetalheSection title="Identificação">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField label="Nome da sala" value={sala.nome_sala} className="sm:col-span-2" />
          <ReadOnlyField label="Código" value={sala.codigo} />
          <ReadOnlyField label="Status" value={sala.status} />
          <ReadOnlyField label="Unidade" value={sala.unidade} className="sm:col-span-2" />
        </div>
      </DetalheSection>

      <DetalheSection title="Operacional">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField
            label="Capacidade"
            value={sala.capacidade != null ? String(sala.capacidade) : undefined}
          />
          <ReadOnlyField label="ID da unidade" value={sala.unidadeId} />
          <ReadOnlyField label="Criado em" value={formatDateTime(sala.createdAt)} />
          <ReadOnlyField label="Atualizado em" value={formatDateTime(sala.updatedAt)} />
        </div>
      </DetalheSection>

      <DetalheSection title="Especialidades atendidas">
        {especialidades.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma especialidade cadastrada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {especialidades.map((esp) => (
              <Badge key={esp} variant="outline">
                {esp}
              </Badge>
            ))}
          </div>
        )}
      </DetalheSection>

      <DetalheSection title="Recursos da sala">
        {recursos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum recurso cadastrado.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recursos.map((recurso) => (
              <Badge key={recurso} variant="secondary">
                {recurso}
              </Badge>
            ))}
          </div>
        )}
      </DetalheSection>
    </div>
  );
};

