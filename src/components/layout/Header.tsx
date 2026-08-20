import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUnidadeAtiva } from '@/contexts/UnidadeContext';
import { Menu, LogOut, User, KeyRound, Building2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const { unidades, unidadeAtivaId, setUnidadeAtiva, podeTrocarUnidade, unidadeAtiva } =
    useUnidadeAtiva();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
      <div className="flex h-16 items-center px-4 gap-4">
        {/* Menu Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block font-semibold text-primary">
            Natielli Paula
          </span>
        </div>

        {/* Page Title */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-navy">{title}</h1>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          {/* Seletor de Unidade */}
          {unidades.length > 0 && (
            <div className="hidden md:flex items-center gap-2 mr-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {podeTrocarUnidade ? (
                <Select value={unidadeAtivaId} onValueChange={setUnidadeAtiva}>
                  <SelectTrigger className="h-9 w-[180px]" aria-label="Unidade">
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary" className="h-7">
                  {unidadeAtiva?.nome ?? '—'}
                </Badge>
              )}
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-5 w-5" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {user?.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/conta/perfil')}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/conta/senha')}>
                <KeyRound className="mr-2 h-4 w-4" />
                <span>Trocar senha</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
