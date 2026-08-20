package handlers

import (
	"net/http"

	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	"espaco-terapia-os/backend/internal/interfaces/http/dto"
	"espaco-terapia-os/backend/internal/interfaces/http/response"

	"github.com/gin-gonic/gin"
)

type AccessControlHandler struct {
	app          *application.AccessControlApp
	errorHandler *httplayer.ErrorHandler
}

func NewAccessControlHandler(app *application.AccessControlApp, errorHandler *httplayer.ErrorHandler) *AccessControlHandler {
	return &AccessControlHandler{app: app, errorHandler: errorHandler}
}

func (h *AccessControlHandler) ListPermissions(c *gin.Context) {
	perms, err := h.app.ListPermissions(c.Request.Context())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, perms, nil)
}

func (h *AccessControlHandler) GetRolePermissions(c *gin.Context) {
	role := entity.UserRole(c.Param("role"))
	codes, err := h.app.ListRolePermissions(c.Request.Context(), role)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	scopes, err := h.app.ListRoleResourceScopes(c.Request.Context(), role)
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, gin.H{
		"role":             role,
		"permission_codes": codes,
		"resource_scopes":  scopes,
	}, nil)
}

func (h *AccessControlHandler) ReplaceRolePermissions(c *gin.Context) {
	role := entity.UserRole(c.Param("role"))
	var req dto.ReplaceRolePermissionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.errorHandler.HandleValidationError(c, "Dados inválidos")
		return
	}
	if err := h.app.ReplaceRolePermissions(c.Request.Context(), role, req.PermissionCodes); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	scopeItems := make([]repository.RoleResourceScope, 0, len(req.ResourceScopes))
	for _, item := range req.ResourceScopes {
		scopeItems = append(scopeItems, repository.RoleResourceScope{
			Resource:  item.Resource,
			ScopeCode: item.ScopeCode,
		})
	}
	if err := h.app.ReplaceRoleResourceScopes(c.Request.Context(), role, scopeItems); err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, gin.H{
		"role":             role,
		"permission_codes": req.PermissionCodes,
		"resource_scopes": scopeItems,
	}, nil)
}

func (h *AccessControlHandler) ListDataScopes(c *gin.Context) {
	scopes, err := h.app.ListDataScopes(c.Request.Context())
	if err != nil {
		h.errorHandler.Handle(c, err)
		return
	}
	response.JSONSuccess(c, http.StatusOK, scopes, nil)
}
