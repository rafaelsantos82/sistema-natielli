import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageToolbar } from '@/components/common/PageToolbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChangePasswordForm } from '@/components/forms/ChangePasswordForm';
import { useAuth } from '@/contexts/AuthContext';
import { KeyRound, Shield, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SECURITY_TIPS = [
  'Use uma senha única que você não utiliza em outros sites.',
  'Combine letras e números para aumentar a segurança.',
  'Evite dados óbvios como nome, e-mail ou datas de nascimento.',
  'Altere a senha periodicamente ou se suspeitar de acesso indevido.',
];

const ContaSenha = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mandatory = Boolean(user?.mustChangePassword);

  return (
    <MainLayout title="Trocar senha">
      <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-6">
        <PageToolbar
          showBack={!mandatory}
          showAdd={false}
          showSearch={false}
          onBack={() => navigate(-1)}
        />

        {mandatory && (
          <Alert>
            <AlertTitle>Alteração de senha obrigatória</AlertTitle>
            <AlertDescription>
              Por segurança, defina uma nova senha antes de continuar usando o sistema.
            </AlertDescription>
          </Alert>
        )}

        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-background bg-primary/10 shadow-sm sm:h-20 sm:w-20">
                <KeyRound className="h-8 w-8 text-primary sm:h-9 sm:w-9" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="text-xl font-semibold text-navy sm:text-2xl">
                  {mandatory ? 'Defina sua nova senha' : 'Alterar senha'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Mantenha sua conta segura com uma senha forte e exclusiva.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
          <Card className="lg:col-span-3">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Nova senha</CardTitle>
              <CardDescription>
                Preencha os campos abaixo. O botão só é habilitado quando todos os requisitos
                forem atendidos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm
                variant="embedded"
                hideHeader
                showLogout={mandatory}
                description={
                  mandatory
                    ? 'Defina uma senha com pelo menos 8 caracteres e um número para liberar o acesso.'
                    : 'Informe a senha atual e escolha uma nova senha que atenda aos requisitos.'
                }
                onSuccess={mandatory ? undefined : () => navigate(-1)}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4 lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-primary" />
                  Dicas de segurança
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                  {SECURITY_TIPS.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {!mandatory && (
              <Card className="border-primary/20 bg-primary/[0.02]">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="shrink-0 rounded-full bg-primary/10 p-2">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">Meu perfil</p>
                      <p className="text-sm text-muted-foreground">
                        Atualize seu nome e veja dados da conta
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full shrink-0 sm:w-auto" asChild>
                    <Link to="/conta/perfil">
                      Ir para perfil
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ContaSenha;
