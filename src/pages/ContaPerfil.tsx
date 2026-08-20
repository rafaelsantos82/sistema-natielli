import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  ChevronRight,
  KeyRound,
  Loader2,
  Mail,
  Shield,
  User,
} from 'lucide-react';
import { useAccountProfile } from '@/hooks/useAccountProfile';
import { useUnidades } from '@/hooks/useUnidades';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/hooks/useUsers';
import { profileFormSchema, type ProfileFormData } from '@/lib/validations/account.schema';
import { formatQueryError } from '@/lib/api/formatApiError';
import { showErrorToast } from '@/lib/ui/showErrorToast';
import { toast } from 'sonner';
import { getUnidadeSlugFromApiId } from '@/lib/unidades/apiIds';
import { cn } from '@/lib/utils';

function initials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts[0]?.[0]) return parts[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

const ContaPerfil = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading, isError, error, updateProfile, isSaving } = useAccountProfile();
  const { unidades } = useUnidades();

  const displayName = profile?.name ?? user?.name ?? '';
  const displayEmail = profile?.email ?? user?.email ?? '';

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (profile?.name) {
      form.reset({ name: profile.name });
    }
  }, [profile?.name, form]);

  const nomeUnidade = (id: string) => {
    const slug = getUnidadeSlugFromApiId(id) ?? id;
    return unidades.find((u) => u.id === slug || u.id === id)?.nome ?? id;
  };

  const roleLabel = ROLE_LABELS[profile?.role ?? user?.role ?? ''] ?? profile?.role ?? '—';
  const avatarLetters = useMemo(
    () => initials(displayName, displayEmail),
    [displayName, displayEmail],
  );

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await updateProfile(data);
      toast.success('Nome atualizado com sucesso');
    } catch (err) {
      showErrorToast(err, { action: 'salvar', entity: 'o perfil' });
    }
  });

  return (
    <MainLayout title="Meu perfil">
      <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-6">
        <PageToolbar showAdd={false} showSearch={false} onBack={() => navigate(-1)} />

        {isError && (
          <Alert variant="destructive">
            <AlertDescription>{formatQueryError(error, 'perfil')}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-4 py-6 sm:px-6 sm:py-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <Avatar className="h-16 w-16 shrink-0 border-2 border-background shadow-sm sm:h-20 sm:w-20">
                    <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground sm:text-xl">
                      {avatarLetters}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="truncate text-xl font-semibold text-navy sm:text-2xl">
                      {displayName || 'Usuário'}
                    </h2>
                    <p className="flex items-center gap-2 truncate text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{displayEmail}</span>
                    </p>
                    <Badge variant="secondary" className="mt-2 w-fit">
                      {roleLabel}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
              <Card className="lg:col-span-3">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-primary" />
                    Dados pessoais
                  </CardTitle>
                  <CardDescription>
                    Você pode alterar seu nome. O e-mail é definido pelo administrador do sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-1">
                      <div className="space-y-2">
                        <Label htmlFor="profile-name">Nome completo</Label>
                        <Input
                          id="profile-name"
                          autoComplete="name"
                          disabled={isSaving}
                          className="h-10"
                          {...form.register('name')}
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile-email">E-mail</Label>
                        <Input
                          id="profile-email"
                          type="email"
                          value={displayEmail}
                          readOnly
                          disabled
                          tabIndex={-1}
                          aria-readonly="true"
                          className={cn(
                            'h-10 cursor-not-allowed bg-muted/60 text-muted-foreground',
                          )}
                        />
                        <p className="text-xs text-muted-foreground">
                          O e-mail não pode ser alterado nesta tela. Para mudanças, solicite ao
                          administrador.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        disabled={isSaving}
                        onClick={() => profile?.name && form.reset({ name: profile.name })}
                      >
                        Desfazer
                      </Button>
                      <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar nome'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-4 lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Shield className="h-4 w-4 text-primary" />
                      Conta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Perfil de acesso</p>
                      <p className="font-medium text-foreground">{roleLabel}</p>
                    </div>

                    {profile?.unidade_ids && profile.unidade_ids.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="mb-2 flex items-center gap-1.5 text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            Unidades
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.unidade_ids.map((id) => (
                              <Badge key={id} variant="outline" className="font-normal">
                                {nomeUnidade(id)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {(profile?.profissional_id || profile?.paciente_id) && (
                      <>
                        <Separator />
                        <div className="space-y-2 text-muted-foreground">
                          {profile.profissional_id && (
                            <p>
                              <span className="text-foreground">Profissional:</span>{' '}
                              <span className="break-all font-mono text-xs">
                                {profile.profissional_id}
                              </span>
                            </p>
                          )}
                          {profile.paciente_id && (
                            <p>
                              <span className="text-foreground">Paciente:</span>{' '}
                              <span className="break-all font-mono text-xs">
                                {profile.paciente_id}
                              </span>
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/[0.02]">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="rounded-full bg-primary/10 p-2 shrink-0">
                        <KeyRound className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">Segurança</p>
                        <p className="text-sm text-muted-foreground">
                          Atualize sua senha periodicamente
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full shrink-0 sm:w-auto" asChild>
                      <Link to="/conta/senha">
                        Alterar senha
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default ContaPerfil;
