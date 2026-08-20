import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Uma role exigida (admin sempre passa) */
  requiredRole?: UserRole;
  /** Qualquer uma das roles listadas (admin sempre passa) */
  requiredRoles?: UserRole[];
  /** Permissão obrigatória (admin sempre passa) */
  requiredPermission?: string;
  /** Qualquer uma das permissões listadas */
  requiredPermissions?: string[];
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
  requiredPermissions,
}: ProtectedRouteProps) => {
  const { user, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const senhaPaths = ['/alterar-senha', '/conta/senha'];
  if (user.mustChangePassword && !senhaPaths.includes(location.pathname)) {
    return <Navigate to="/conta/senha" replace />;
  }

  const allowed = requiredRoles ?? (requiredRole ? [requiredRole] : null);
  if (allowed && user.role !== 'admin' && !allowed.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  const permissionList = requiredPermissions ?? (requiredPermission ? [requiredPermission] : null);
  if (permissionList && !permissionList.some((perm) => hasPermission(perm))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const PACIENTES_READ_ROLES: UserRole[] = [
  'admin',
  'gestor',
  'funcionario',
  'terapeuta',
  'terceiro',
];

export const PACIENTES_WRITE_ROLES: UserRole[] = [
  'admin',
  'gestor',
  'funcionario',
  'terapeuta',
];
