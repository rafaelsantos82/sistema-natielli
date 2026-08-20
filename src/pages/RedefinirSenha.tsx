import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/ui/showErrorToast';
import logo from '@/assets/logo.png';

const RedefinirSenha = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Link inválido ou expirado');
      return;
    }
    if (password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (password !== confirm) {
      toast.error('As senhas não coincidem');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(token, password);
      toast.success('Senha redefinida. Faça login com a nova senha.');
      navigate('/login');
    } catch (err) {
      showErrorToast(err, { authFlow: 'password-reset', action: 'alterar', entity: 'a senha' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg p-8 border border-border">
        <div className="mb-6 flex justify-center">
          <img src={logo} alt="Espaço Terapia" className="h-12 w-12 object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-navy mb-2">Nova senha</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Escolha uma senha segura com pelo menos 8 caracteres.
        </p>

        {!token ? (
          <p className="text-sm text-destructive mb-4">
            Token ausente. Use o link recebido por e-mail ou solicite um novo em{' '}
            <Link to="/esqueci-senha" className="text-primary underline">
              esqueci minha senha
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Redefinir senha'}
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

export default RedefinirSenha;
