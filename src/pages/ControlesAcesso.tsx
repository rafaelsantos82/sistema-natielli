import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Shield } from 'lucide-react';
import {
  useDataScopesCatalog,
  usePermissionsCatalog,
  useReplaceRolePermissions,
  useRolePermissions,
} from '@/hooks/useAccessControl';
import type { AccessRole, ClinicalResource, RoleResourceScopeDTO } from '@/lib/api/accessControl';
import {
  CLINICAL_RESOURCES,
  PERMISSION_ACTIONS,
  apiPermissionCode,
} from '@/lib/api/accessControl';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EDITABLE_ROLES: AccessRole[] = ['gestor', 'funcionario', 'terceiro', 'terapeuta', 'responsavel'];

const ROLE_LABEL: Record<AccessRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  funcionario: 'Funcionário',
  terceiro: 'Terceiro',
  terapeuta: 'Terapeuta',
  responsavel: 'Responsável',
};

const RESOURCE_LABEL: Record<ClinicalResource, string> = {
  pacientes: 'Pacientes',
  consultas: 'Consultas',
  prontuario: 'Prontuário',
  anamneses: 'Anamneses',
  terapias: 'Terapia',
};

const ACTION_LABEL: Record<(typeof PERMISSION_ACTIONS)[number], string> = {
  read: 'Ler',
  write: 'Escrever',
  delete: 'Excluir',
  manage: 'Gerenciar',
};

const ControlesAcesso = () => {
  const [selectedRole, setSelectedRole] = useState<AccessRole>('gestor');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [resourceScopes, setResourceScopes] = useState<RoleResourceScopeDTO[]>([]);

  const catalogQuery = usePermissionsCatalog();
  const scopesCatalogQuery = useDataScopesCatalog();
  const roleQuery = useRolePermissions(selectedRole);
  const replaceMutation = useReplaceRolePermissions();

  useEffect(() => {
    setSelectedCodes(roleQuery.data?.permission_codes ?? []);
    setResourceScopes(roleQuery.data?.resource_scopes ?? []);
  }, [roleQuery.data?.permission_codes, roleQuery.data?.resource_scopes, selectedRole]);

  const menuPermissions = useMemo(
    () =>
      (catalogQuery.data ?? [])
        .filter((item) => item.code?.startsWith('menu.'))
        .sort((a, b) => a.code.localeCompare(b.code)),
    [catalogQuery.data],
  );

  const apiByResource = useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    for (const item of catalogQuery.data ?? []) {
      if (!item.code?.startsWith('api.')) continue;
      const parts = item.code.split('.');
      if (parts.length < 3) continue;
      const resource = parts[1];
      const action = parts[2];
      if (!map.has(resource)) map.set(resource, new Map());
      map.get(resource)!.set(action, item.code);
    }
    return map;
  }, [catalogQuery.data]);

  const scopeOptions = scopesCatalogQuery.data ?? [];

  const toggle = (code: string, checked: boolean) => {
    setSelectedCodes((prev) => {
      if (checked) return [...new Set([...prev, code])];
      return prev.filter((item) => item !== code);
    });
  };

  const setScopeForResource = (resource: ClinicalResource, scopeCode: string) => {
    setResourceScopes((prev) => {
      const rest = prev.filter((s) => s.resource !== resource);
      return [...rest, { resource, scope_code: scopeCode }];
    });
  };

  const scopeFor = (resource: ClinicalResource): string => {
    return resourceScopes.find((s) => s.resource === resource)?.scope_code ?? 'all';
  };

  const save = async () => {
    await replaceMutation.mutateAsync({
      role: selectedRole,
      permissionCodes: selectedCodes,
      resourceScopes,
    });
  };

  return (
    <MainLayout title="Controles de acesso">
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Shield className="h-5 w-5" />
          <p className="text-sm">
            Configure permissões por ação (API), itens de menu e escopo de dados por recurso clínico.
          </p>
        </div>

        <div className="space-y-2 max-w-sm">
          <Label>Perfil</Label>
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AccessRole)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o perfil" />
            </SelectTrigger>
            <SelectContent>
              {EDITABLE_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABEL[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Administrador sempre possui acesso total e não é editável.</p>
        </div>

        <Tabs defaultValue="api">
          <TabsList>
            <TabsTrigger value="api">API (ações)</TabsTrigger>
            <TabsTrigger value="scopes">Escopo de dados</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
          </TabsList>

          <TabsContent value="api" className="space-y-6 pt-4">
            {CLINICAL_RESOURCES.map((resource) => (
              <div key={resource} className="rounded-md border p-4 space-y-3">
                <h3 className="font-medium">{RESOURCE_LABEL[resource]}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {PERMISSION_ACTIONS.map((action) => {
                    const code =
                      apiByResource.get(resource)?.get(action) ?? apiPermissionCode(resource, action);
                    const checked = selectedCodes.includes(code);
                    return (
                      <label key={code} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={checked} onCheckedChange={(v) => toggle(code, Boolean(v))} />
                        <span>{ACTION_LABEL[action]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="scopes" className="space-y-4 pt-4">
            {CLINICAL_RESOURCES.map((resource) => (
              <div key={resource} className="flex flex-col sm:flex-row sm:items-center gap-2 max-w-lg">
                <Label className="sm:w-40">{RESOURCE_LABEL[resource]}</Label>
                <Select value={scopeFor(resource)} onValueChange={(v) => setScopeForResource(resource, v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeOptions.map((opt) => (
                      <SelectItem key={opt.code} value={opt.code}>
                        {opt.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="menu" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {menuPermissions.map((permission) => {
                const checked = selectedCodes.includes(permission.code);
                return (
                  <label key={permission.code} className="flex items-center gap-3 rounded-md border p-3">
                    <Checkbox checked={checked} onCheckedChange={(v) => toggle(permission.code, Boolean(v))} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{permission.description}</span>
                      <span className="text-xs text-muted-foreground">{permission.code}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={save} disabled={replaceMutation.isPending || roleQuery.isLoading}>
            Salvar permissões e escopos
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default ControlesAcesso;
