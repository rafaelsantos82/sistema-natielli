import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/ui/showErrorToast';

const EsqueciSenha = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Informe seu e-mail');
      return;
    }
    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
      toast.success('Se o e-mail existir, enviaremos instruções em instantes.');
    } catch (err) {
      showErrorToast(err, { action: 'enviar', entity: 'a solicitação de recuperação' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg p-8 border border-border">
        <h1 className="text-2xl font-bold text-navy mb-2">Esqueci minha senha</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Informe o e-mail da sua conta. Se existir cadastro ativo, você receberá um link para
          redefinir a senha.
        </p>

        {sent ? (
          <p className="text-sm text-muted-foreground mb-6">
            Verifique sua caixa de entrada e o spam. O link expira em cerca de 1 hora.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar link'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-primary hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default EsqueciSenha;
