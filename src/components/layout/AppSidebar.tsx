import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  ClipboardList,
  UserCog,
  BarChart3,
  Package,
  DollarSign,
  FileText,
  Receipt,
  Wallet,
  FileCheck,
  HeartPulse,
  Calendar,
  FolderOpen,
  Settings,
  TrendingUp,
  Shield,
  KeyRound,
  Boxes,
  Gavel,
  CheckSquare,
  CalendarDays,
  ClipboardCheck,
  Sparkles,
  // Building2, // Unidades (menu oculto)
  type LucideIcon,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { useMenuBadges, type MenuBadgeKey } from './useMenuBadges';

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  permission?: string;
  /** Roles permitidos. Ausente = visível a todos. */
  roles?: UserRole[];
  /** Chave para exibir contador de pendências. */
  badgeKey?: MenuBadgeKey;
  /** Item placeholder ainda não implementado. */
  todo?: boolean;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
  /** Destaque visual (cor primária). */
  highlight?: boolean;
  /** Roles permitidos para o grupo inteiro. */
  roles?: UserRole[];
}

/**
 * Estrutura organizada por fluxo de trabalho clínico.
 * Personas (RBAC):
 *  - admin/gestor: tudo
 *  - funcionario / terapeuta  (recepção/profissional): Atendimento, Clínico, Profissionais, Documentos
 *  - terceiro     (financeiro/RH externo): Financeiro, RH & Contratos, Relatórios
 *
 * URLs preservadas — nenhuma rota foi renomeada.
 */
const MENU_GROUPS: MenuGroup[] = [
  {
    label: 'Recepção',
    items: [
      { title: 'Agenda', url: '/agenda', icon: Calendar, permission: 'menu.agenda.view' },
      {
        title: 'Agendamentos',
        url: '/consultas',
        icon: CalendarDays,
        permission: 'menu.consultas.view',
        badgeKey: 'consultas_pendentes',
      },
      { title: 'Pacientes', url: '/pacientes', icon: Users, permission: 'menu.pacientes.view' },
      { title: 'Terapias', url: '/terapias', icon: Stethoscope, permission: 'menu.terapias.view' },
      { title: 'Salas de Atendimento', url: '/salas', icon: FolderOpen, permission: 'menu.salas.view' },
    ],
  },
  {
    label: 'Clínico',
    roles: ['admin', 'gestor', 'funcionario', 'terapeuta'],
    items: [
      { title: 'Prontuários', url: '/prontuarios', icon: ClipboardList, permission: 'menu.prontuarios.view' },
      { title: 'Anamneses', url: '/anamneses', icon: ClipboardCheck, permission: 'menu.anamneses.view' },
      {
        title: 'Aprovação Atendimentos',
        url: '/atendimentos/aprovacoes',
        icon: CheckSquare,
        permission: 'menu.aprovacoes.view',
        badgeKey: 'aprovacoes_pendentes',
      },
      { title: 'Docs Assinados', url: '/documentos-assinados', icon: Shield, permission: 'menu.docs-assinados.view' },
    ],
  },
  {
    label: 'Profissionais',
    roles: ['admin', 'gestor', 'funcionario', 'terapeuta'],
    items: [
      {
        title: 'Meu Painel',
        url: '/meu-painel',
        icon: TrendingUp,
        permission: 'menu.meu-painel.view',
        roles: ['admin', 'gestor', 'funcionario', 'terapeuta'],
      },
      {
        title: 'Minha Agenda',
        url: '/minha-agenda',
        icon: CalendarDays,
        permission: 'menu.minha-agenda.view',
        roles: ['admin', 'gestor', 'funcionario', 'terapeuta'],
      },
      {
        title: 'Profissionais',
        url: '/profissionais',
        icon: UserCog,
        permission: 'menu.profissionais.view',
        badgeKey: 'profissionais_pendentes',
        roles: ['admin', 'gestor'],
      },
    ],
  },
  {
    label: 'Financeiro',
    roles: ['admin', 'gestor', 'terceiro'],
    items: [
      { title: 'Financeiro', url: '/financeiro', icon: DollarSign, permission: 'menu.financeiro.view' },
      { title: 'Balancetes', url: '/balancetes', icon: Receipt, permission: 'menu.balancetes.view' },
      { title: 'Relatórios Conciliação', url: '/relatorios-conciliacao', icon: BarChart3, permission: 'menu.relatorios-conciliacao.view' },
      { title: 'Auditoria de Notas', url: '/auditoria-notas', icon: FileCheck, permission: 'menu.auditoria-notas.view' },
    ],
  },
  {
    label: 'RH & Contratos',
    roles: ['admin', 'gestor', 'terceiro'],
    items: [
      { title: 'Contratos', url: '/contratos', icon: FileText, permission: 'menu.contratos.view' },
      { title: 'Folha de Pagamento', url: '/folha-pagamento', icon: Wallet, permission: 'menu.folha-pagamento.view' },
    ],
  },
  {
    label: 'Planos & Jurídico',
    roles: ['admin', 'gestor'],
    items: [
      { title: 'Planos de Saúde', url: '/planos-saude', icon: HeartPulse, permission: 'menu.planos-saude.view' },
      { title: 'Ações Judiciais', url: '/acoes-judiciais', icon: Gavel, permission: 'menu.acoes-judiciais.view' },
    ],
  },
  {
    label: 'Estoque & Ativos',
    roles: ['admin', 'gestor', 'funcionario', 'terapeuta'],
    items: [
      { title: 'Estoque', url: '/estoque', icon: Package, permission: 'menu.estoque.view' },
      { title: 'Comodato', url: '/comodato', icon: Boxes, permission: 'menu.comodato.view' },
    ],
  },
  {
    label: 'Relatórios',
    roles: ['admin', 'gestor', 'terceiro'],
    // Estrutura preparada para futura subdivisão:
    // Operacionais / Financeiros / Avançados
    items: [
      { title: 'Relatórios', url: '/relatorios', icon: BarChart3, permission: 'menu.relatorios.view' },
      { title: 'Relatórios Avançados', url: '/relatorios-avancados', icon: TrendingUp, permission: 'menu.relatorios-avancados.view' },
    ],
  },
  {
    label: 'Marketing',
    roles: ['admin', 'gestor'],
    items: [{ title: 'Marketing', url: '/marketing', icon: Sparkles, permission: 'menu.marketing.view' }],
  },
  {
    label: 'Documentos',
    items: [{ title: 'Documentos', url: '/documentos', icon: FolderOpen, permission: 'menu.documentos.view' }],
  },
  {
    label: 'Administração',
    roles: ['admin', 'gestor'],
    items: [
      // { title: 'Unidades', url: '/unidades', icon: Building2, roles: ['admin', 'gestor'], permission: 'menu.unidades.view' },
      { title: 'Usuários', url: '/configuracoes/usuarios', icon: Settings, roles: ['admin'], permission: 'menu.configuracoes.usuarios.view' },
      { title: 'Controles de acesso', url: '/configuracoes/controles-acesso', icon: Settings, roles: ['admin'], permission: 'menu.configuracoes.acessos.view' },
      { title: 'Chave Digital', url: '/configuracoes/chave-digital', icon: KeyRound, roles: ['admin', 'gestor'], permission: 'menu.configuracoes.chave-digital.view' },
      // TODO: Logs / Auditoria
    ],
  },
];

const isVisibleForRole = (
  allowed: UserRole[] | undefined,
  role: UserRole | undefined,
) => {
  if (!allowed || allowed.length === 0) return true;
  if (!role) return false;
  return allowed.includes(role);
};

export function AppSidebar() {
  const { state } = useSidebar();
  const { pathname } = useLocation();
  const { user, hasPermission } = useAuth();
  const badges = useMenuBadges();
  const collapsed = state === 'collapsed';

  const visibleGroups = MENU_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      const roleVisible = isVisibleForRole(item.roles, user?.role);
      const permissionVisible = item.permission ? hasPermission(item.permission) : true;
      return roleVisible && permissionVisible;
    }),
  })).filter(
    (group) => isVisibleForRole(group.roles, user?.role) && group.items.length > 0,
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        {visibleGroups.map((group) => {
          const groupActive = group.items.some((item) => pathname === item.url);
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel
                className={cn(
                  group.highlight && 'text-primary font-semibold uppercase tracking-wide',
                )}
              >
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = pathname === item.url;
                    const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                        >
                          <NavLink
                            to={item.url}
                            className={cn(
                              'flex items-center gap-3 transition-colors',
                              group.highlight &&
                                !isActive &&
                                'hover:text-primary',
                            )}
                          >
                            <item.icon
                              className={cn(
                                'h-4 w-4 shrink-0',
                                group.highlight && !isActive && 'text-primary',
                              )}
                            />
                            {!collapsed && (
                              <span className="flex-1 truncate">{item.title}</span>
                            )}
                            {!collapsed && badgeCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="h-5 min-w-5 justify-center px-1.5 text-[10px]"
                              >
                                {badgeCount > 99 ? '99+' : badgeCount}
                              </Badge>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
