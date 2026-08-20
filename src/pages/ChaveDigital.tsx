import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { KeyRound, Shield, Upload, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChaveDigital, useChaveDigitalMutations } from '@/hooks/useChaveDigital';
import { resolveUnidadeApiId } from '@/lib/unidades/apiIds';
import { featureFlags } from '@/lib/featureFlags';
import { formatQueryError } from '@/lib/api/formatApiError';

const ChaveDigital = () => {
  const { unidadeAtiva, unidadeAtivaId } = useUnidadeAtiva();
  const { canWrite } = useAuth();
  const canMutate = canWrite('chave-digital');

  const fileRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [pfxFile, setPfxFile] = useState<File | null>(null);
  const [replaceMode, setReplaceMode] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  const unidadeApiId = resolveUnidadeApiId(unidadeAtivaId);
  const { data: chave, isLoading, isError, error } = useChaveDigital(unidadeAtivaId);
  const { registerMutation, revokeMutation } = useChaveDigitalMutations(unidadeAtivaId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPfxFile(e.target.files?.[0] ?? null);
  };

  const handleRegister = () => {
    if (!pfxFile || !password.trim()) return;
    registerMutation.mutate(
      { file: pfxFile, password },
      {
        onSuccess: () => {
          setPassword('');
          setPfxFile(null);
          setReplaceMode(false);
          if (fileRef.current) fileRef.current.value = '';
        },
      },
    );
  };

  const certExpired = chave
    ? new Date(chave.cert_valid_to).getTime() < Date.now()
    : false;

  const showForm = !chave || replaceMode;

  if (!featureFlags.chaveDigitalApiEnabled) {
    return (
      <MainLayout title="Chave Digital">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Integração com API desabilitada (VITE_API_CHAVE_DIGITAL=false).
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Chave Digital">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <KeyRound className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Certificado por unidade</h2>
            <p className="text-sm text-muted-foreground">
              ICP-Brasil (A1) para assinatura de documentos no servidor, sem senha no ato da assinatura.
            </p>
          </div>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Unidade ativa: <strong>{unidadeAtiva?.nome ?? '—'}</strong>. Cada unidade possui no
            máximo uma chave ativa. A senha do certificado é informada apenas no cadastro e armazenada
            cifrada no servidor.
          </AlertDescription>
        </Alert>

        {!unidadeApiId && unidadeAtivaId && (
          <Alert variant="destructive">
            <AlertDescription>
              A unidade ativa não possui UUID mapeado para a API (
              <code className="text-xs">{unidadeAtivaId}</code>). Verifique se a unidade existe no
              backend ou atualize o mapeamento em{' '}
              <code className="text-xs">src/lib/unidades/apiIds.ts</code>.
            </AlertDescription>
          </Alert>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertDescription>{formatQueryError(error)}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Carregando…
            </CardContent>
          </Card>
        ) : chave && !replaceMode ? (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Chave ativa
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Badge variant={certExpired ? 'destructive' : 'default'}>
                  {certExpired ? 'Expirada' : chave.is_valid ? 'Válida' : 'Inválida'}
                </Badge>
                {chave.is_icp_brasil && (
                  <Badge variant="secondary">ICP-Brasil</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Titular</p>
                  <p className="font-medium">{chave.signer_common_name}</p>
                </div>
                {chave.signer_org && (
                  <div>
                    <p className="text-muted-foreground">Organização</p>
                    <p className="font-medium">{chave.signer_org}</p>
                  </div>
                )}
                {chave.signer_cpf && (
                  <div>
                    <p className="text-muted-foreground">CPF</p>
                    <p className="font-medium">{chave.signer_cpf}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Emissor</p>
                  <p className="font-medium break-all">{chave.cert_issuer}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Serial</p>
                  <p className="font-mono text-xs">{chave.cert_serial}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Válido de</p>
                  <p className="font-medium">
                    {format(new Date(chave.cert_valid_from), 'dd/MM/yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Válido até</p>
                  <p className="font-medium">
                    {format(new Date(chave.cert_valid_to), 'dd/MM/yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Algoritmo</p>
                  <p className="font-medium">{chave.algoritmo}</p>
                </div>
              </div>

              {canMutate && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setReplaceMode(true)}>
                    Substituir certificado
                  </Button>
                  <Button variant="destructive" onClick={() => setRevokeOpen(true)}>
                    Revogar chave
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {showForm && canMutate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {chave ? 'Substituir certificado' : 'Cadastrar certificado'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <p className="text-sm text-muted-foreground">
                Envie o arquivo <code className="text-xs">.pfx</code> ou{' '}
                <code className="text-xs">.p12</code> (certificado A1). Tokens A3 não são
                suportados.
              </p>
              <div className="space-y-2">
                <Label htmlFor="pfx">Arquivo do certificado</Label>
                <Input
                  id="pfx"
                  ref={fileRef}
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleFileChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cert-password">Senha do certificado</Label>
                <Input
                  id="cert-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Informada apenas neste cadastro"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleRegister}
                  disabled={
                    !pfxFile ||
                    !password.trim() ||
                    registerMutation.isPending ||
                    !unidadeAtivaId
                  }
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Validar e salvar
                </Button>
                {replaceMode && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setReplaceMode(false);
                      setPassword('');
                      setPfxFile(null);
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!canMutate && !chave && !isLoading && (
          <Alert>
            <AlertDescription>
              Você não tem permissão para cadastrar a chave digital. Solicite a um administrador ou
              gestor.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <ConfirmDialog
        isOpen={revokeOpen}
        onCancel={() => setRevokeOpen(false)}
        onConfirm={() => {
          revokeMutation.mutate(undefined, { onSuccess: () => setRevokeOpen(false) });
        }}
        title="Revogar chave digital"
        description="A chave atual será revogada. Documentos já assinados permanecem válidos, mas novas assinaturas exigirão um novo certificado."
        variant="destructive"
        confirmLabel="Revogar"
      />
    </MainLayout>
  );
};

export default ChaveDigital;
