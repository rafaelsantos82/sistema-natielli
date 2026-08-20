package handlers

import (
	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func loadActorFromGin(c *gin.Context, scopeSvc *service.DataScopeService) (*service.Actor, error) {
	uid, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		return nil, domainerrors.NewUnauthorizedError("Sessão inválida")
	}
	role := entity.UserRole(c.GetString("role"))
	if !role.Valid() {
		return nil, domainerrors.NewForbiddenError("Acesso negado")
	}
	return scopeSvc.LoadActor(c.Request.Context(), uid, role)
}
