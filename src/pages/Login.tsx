import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/ui/showErrorToast';
import { LogIn } from 'lucide-react';
import logo from '@/assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      showErrorToast(error, { authFlow: 'login' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-accent to-primary-hover items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-lg p-3">
              <img src={logo} alt="Espaço Terapia" className="h-full w-full object-contain" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Espaço Terapia</h1>
          <p className="text-lg text-white/90">
            Sistema completo de gestão clínica com segurança e eficiência
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-lg p-2">
                <img src={logo} alt="Espaço Terapia" className="h-full w-full object-contain" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-navy">Espaço Terapia</h1>
          </div>

          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-navy mb-2">Bem-vindo de volta</h2>
              <p className="text-muted-foreground">
                Faça login para acessar o sistema
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail ou usuário</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              {import.meta.env.VITE_AUTH_BOOTSTRAP !== 'true' && (
                <div className="flex justify-end">
                  <Link
                    to="/esqueci-senha"
                    className="text-sm text-primary hover:text-primary-hover transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary-hover"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    <span>Entrar</span>
                  </div>
                )}
              </Button>
            </form>

            {import.meta.env.VITE_AUTH_BOOTSTRAP === 'true' && (
              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p className="text-xs">
                  Modo bootstrap: qualquer e-mail/senha em dev. Para login real, use{' '}
                  <code className="text-xs">make seed-admin</code> e desative bootstrap.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
