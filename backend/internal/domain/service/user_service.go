package service

import (
	"context"
	"log/slog"
	"strings"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/platform/requestcontext"

	"github.com/google/uuid"
)

type UserService struct {
	repo   repository.UserRepository
	audit  *AuditService
	logger *slog.Logger
}

func NewUserService(repo repository.UserRepository, audit *AuditService, logger *slog.Logger) *UserService {
	return &UserService{repo: repo, audit: audit, logger: logger}
}

func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (*UserDTO, error) {
	if id == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("id")
	}
	if id == entity.SystemUserID {
		return nil, domainerrors.NewNotFoundError("Usuário", id.String())
	}
	u, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if u == nil || u.DeletedAt != nil {
		return nil, domainerrors.NewNotFoundError("Usuário", id.String())
	}
	return ToUserDTO(u), nil
}

func (s *UserService) List(ctx context.Context, filter repository.UserListFilter) (*ListUsersResult, error) {
	filter.Page, filter.PageSize = NormalizePagination(filter.Page, filter.PageSize)
	items, total, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, err
	}
	dtos := make([]*UserDTO, 0, len(items))
	for _, u := range items {
		dtos = append(dtos, ToUserDTO(u))
	}
	return &ListUsersResult{
		Items:      dtos,
		Total:      total,
		Page:       filter.Page,
		PageSize:   filter.PageSize,
		TotalPages: TotalPages(total, filter.PageSize),
	}, nil
}

func (s *UserService) Create(ctx context.Context, in CreateUserInput) (*UserDTO, error) {
	if err := validateUserInput(in.Name, in.Email, in.Role); err != nil {
		return nil, err
	}
	if err := validateUserScopeLinkage(in.Role, in.PacienteID, in.ProfissionalID); err != nil {
		return nil, err
	}
	hash, err := HashPassword(in.Password)
	if err != nil {
		return nil, err
	}

	u := &entity.User{
		ID:           uuid.New(),
		Name:         strings.TrimSpace(in.Name),
		Email:        normalizeEmail(in.Email),
		PasswordHash: hash,
		Role:         in.Role,
		PacienteID:     in.PacienteID,
		ProfissionalID: in.ProfissionalID,
		UnidadeIDs:     in.UnidadeIDs,
	}
	if err := s.repo.Create(ctx, u); err != nil {
		return nil, err
	}
	s.recordAudit(ctx, AuditUsuarioCriacao, u.ID.String(), nil, map[string]interface{}{"after": UserAuditSnapshotFrom(u)})
	return ToUserDTO(u), nil
}

func (s *UserService) Update(ctx context.Context, id uuid.UUID, in UpdateUserInput) (*UserDTO, error) {
	if id == entity.SystemUserID {
		return nil, domainerrors.NewForbiddenError("Usuário sistema não pode ser alterado")
	}
	if err := validateUserInput(in.Name, in.Email, in.Role); err != nil {
		return nil, err
	}
	if err := validateUserScopeLinkage(in.Role, in.PacienteID, in.ProfissionalID); err != nil {
		return nil, err
	}

	existing, err := s.repo.FindByIDUnscoped(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, domainerrors.NewNotFoundError("Usuário", id.String())
	}
	if existing.DeletedAt != nil {
		return nil, domainerrors.NewConflictError("Usuário excluído não pode ser editado. Restaure o cadastro antes.")
	}
	before := UserAuditSnapshotFrom(existing)

	if existing.Role == entity.UserRoleAdmin && in.Role != entity.UserRoleAdmin {
		if err := s.ensureNotLastAdmin(ctx, &id); err != nil {
			return nil, err
		}
	}

	existing.Name = strings.TrimSpace(in.Name)
	existing.Email = normalizeEmail(in.Email)
	existing.Role = in.Role
	existing.PacienteID = in.PacienteID
	existing.ProfissionalID = in.ProfissionalID
	existing.UnidadeIDs = in.UnidadeIDs
	if in.Password != "" {
		hash, err := HashPassword(in.Password)
		if err != nil {
			return nil, err
		}
		existing.PasswordHash = hash
		if in.MustChangePassword != nil {
			existing.MustChangePassword = *in.MustChangePassword
		} else {
			existing.MustChangePassword = true
		}
	} else if in.MustChangePassword != nil {
		existing.MustChangePassword = *in.MustChangePassword
	}

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	s.recordAudit(ctx, AuditUsuarioEdicao, id.String(), map[string]interface{}{"before": before}, map[string]interface{}{"after": UserAuditSnapshotFrom(existing)})
	return ToUserDTO(existing), nil
}

func (s *UserService) Delete(ctx context.Context, id, actorID uuid.UUID) error {
	if id == entity.SystemUserID {
		return domainerrors.NewForbiddenError("Usuário sistema não pode ser excluído")
	}
	if id == actorID {
		return domainerrors.NewBusinessRuleError("Não é possível excluir o próprio usuário")
	}

	u, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if u == nil || u.DeletedAt != nil {
		return domainerrors.NewNotFoundError("Usuário", id.String())
	}
	if u.Role == entity.UserRoleAdmin {
		if err := s.ensureNotLastAdmin(ctx, &id); err != nil {
			return err
		}
	}
	if err := s.repo.SoftDelete(ctx, id); err != nil {
		return err
	}
	s.recordAudit(ctx, AuditUsuarioExclusao, id.String(), map[string]interface{}{"before": UserAuditSnapshotFrom(u)}, nil)
	return nil
}

func (s *UserService) Restore(ctx context.Context, id uuid.UUID) (*UserDTO, error) {
	if id == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("id")
	}
	if id == entity.SystemUserID {
		return nil, domainerrors.NewForbiddenError("Usuário sistema não pode ser restaurado")
	}
	existing, err := s.repo.FindByIDUnscoped(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, domainerrors.NewNotFoundError("Usuário", id.String())
	}
	if existing.DeletedAt == nil {
		return nil, domainerrors.NewConflictError("Usuário já está ativo")
	}
	before := UserAuditSnapshotFrom(existing)

	if err := s.repo.Restore(ctx, id); err != nil {
		return nil, err
	}

	restored, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if restored == nil {
		return nil, domainerrors.NewNotFoundError("Usuário", id.String())
	}
	after := UserAuditSnapshotFrom(restored)
	s.recordAudit(ctx, AuditUsuarioRestauracao, id.String(), map[string]interface{}{"before": before}, map[string]interface{}{"after": after})
	return ToUserDTO(restored), nil
}

func (s *UserService) recordAudit(ctx context.Context, action, entityID string, before, after map[string]interface{}) {
	actorID, actorName, actorRole := actorFromCtx(ctx)
	if actorID == uuid.Nil {
		return
	}
	diff := map[string]interface{}{}
	if before != nil {
		for k, v := range before {
			diff[k] = v
		}
	}
	if after != nil {
		for k, v := range after {
			diff[k] = v
		}
	}
	ip, ua := auditMeta(ctx)
	RecordUserAudit(ctx, s.audit, actorID, actorName, actorRole, action, entityID, diff, ip, ua)
}

func actorFromCtx(ctx context.Context) (uuid.UUID, string, string) {
	idStr, name, role := requestcontext.ActorFromContext(ctx)
	id, err := uuid.Parse(idStr)
	if err != nil {
		return uuid.Nil, name, role
	}
	if name == "" {
		name = idStr
	}
	return id, name, role
}

func (s *UserService) ensureNotLastAdmin(ctx context.Context, excludeID *uuid.UUID) error {
	count, err := s.repo.CountActiveAdmins(ctx, excludeID)
	if err != nil {
		return err
	}
	if count < 1 {
		return domainerrors.NewBusinessRuleError("Deve existir pelo menos um administrador ativo no sistema")
	}
	return nil
}

func validateUserInput(name, email string, role entity.UserRole) error {
	if strings.TrimSpace(name) == "" {
		return domainerrors.NewRequiredFieldError("name")
	}
	if strings.TrimSpace(email) == "" {
		return domainerrors.NewRequiredFieldError("email")
	}
	if !role.Valid() {
		return domainerrors.NewInvalidFormatError("role", "perfil inválido")
	}
	return nil
}

func validateUserScopeLinkage(role entity.UserRole, pacienteID, profissionalID *uuid.UUID) error {
	switch role {
	case entity.UserRoleResponsavel:
		if pacienteID == nil || *pacienteID == uuid.Nil {
			return domainerrors.NewRequiredFieldError("paciente_id")
		}
		if profissionalID != nil {
			return domainerrors.NewValidationError("O vínculo com profissional não é permitido para o perfil responsável")
		}
	case entity.UserRoleTerapeuta:
		if profissionalID == nil || *profissionalID == uuid.Nil {
			return domainerrors.NewRequiredFieldError("profissional_id")
		}
		if pacienteID != nil {
			return domainerrors.NewValidationError("O vínculo com paciente não é permitido para o perfil terapeuta")
		}
	default:
		if pacienteID != nil {
			return domainerrors.NewValidationError("O vínculo com paciente só é permitido para o perfil responsável")
		}
		if profissionalID != nil {
			return domainerrors.NewValidationError("O vínculo com profissional só é permitido para o perfil terapeuta")
		}
	}
	return nil
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
