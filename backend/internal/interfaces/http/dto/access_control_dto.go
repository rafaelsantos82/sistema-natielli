package dto

type RoleResourceScopeItem struct {
	Resource  string `json:"resource"`
	ScopeCode string `json:"scope_code"`
}

type ReplaceRolePermissionsRequest struct {
	PermissionCodes []string                `json:"permission_codes"`
	ResourceScopes  []RoleResourceScopeItem `json:"resource_scopes"`
}
