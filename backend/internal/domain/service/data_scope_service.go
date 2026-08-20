package service

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type DataScopeService struct {
	scopes repository.DataScopeRepository
	users  repository.UserRepository
}

func NewDataScopeService(scopes repository.DataScopeRepository, users repository.UserRepository) *DataScopeService {
	return &DataScopeService{scopes: scopes, users: users}
}

type Actor struct {
	ID             uuid.UUID
	Role           entity.UserRole
	PacienteID     *uuid.UUID
	ProfissionalID *uuid.UUID
	UnidadeIDs     []uuid.UUID
}

func (s *DataScopeService) LoadActor(ctx context.Context, userID uuid.UUID, role entity.UserRole) (*Actor, error) {
	if role == entity.UserRoleAdmin {
		return &Actor{ID: userID, Role: role}, nil
	}
	u, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if u == nil || u.DeletedAt != nil {
		return nil, domainerrors.NewUnauthorizedError("Usuário não encontrado")
	}
	return &Actor{
		ID:             u.ID,
		Role:           u.Role,
		PacienteID:     u.PacienteID,
		ProfissionalID: u.ProfissionalID,
		UnidadeIDs:     u.UnidadeIDs,
	}, nil
}

func (s *DataScopeService) ResolveScopeForResource(ctx context.Context, actor *Actor, resource string) (string, error) {
	return s.resolveScope(ctx, actor, resource)
}

func (s *DataScopeService) resolveScope(ctx context.Context, actor *Actor, resource string) (string, error) {
	if actor.Role == entity.UserRoleAdmin {
		return entity.DataScopeAll, nil
	}
	return s.scopes.GetRoleResourceScope(ctx, actor.Role, resource)
}

func (s *DataScopeService) ApplyPacienteListScope(ctx context.Context, actor *Actor, filter *repository.PacienteListFilter) error {
	scope, err := s.resolveScope(ctx, actor, "pacientes")
	if err != nil {
		return err
	}
	switch scope {
	case entity.DataScopeAll:
		return nil
	case entity.DataScopeSelfPatient:
		if actor.PacienteID == nil || *actor.PacienteID == uuid.Nil {
			return domainerrors.NewForbiddenError("Conta sem paciente vinculado")
		}
		filter.OnlyPacienteID = actor.PacienteID
	case entity.DataScopeTherapistPatients:
		if actor.ProfissionalID == nil || *actor.ProfissionalID == uuid.Nil {
			return domainerrors.NewForbiddenError("Conta sem profissional vinculado")
		}
		filter.TherapistProfissionalID = actor.ProfissionalID
		filter.EnrichTherapistCarteira = true
		filter.OrderByProximaConsulta = true
	case entity.DataScopeUnitPatients:
		if len(actor.UnidadeIDs) == 0 {
			return nil
		}
		filter.AllowedUnidadeIDs = actor.UnidadeIDs
	default:
		return domainerrors.NewForbiddenError("Escopo de acesso inválido")
	}
	return nil
}

func (s *DataScopeService) AssertPacienteAccess(ctx context.Context, actor *Actor, pacienteID uuid.UUID) error {
	return s.AssertScopedPacienteAccess(ctx, actor, "pacientes", pacienteID)
}

func (s *DataScopeService) AssertScopedPacienteAccess(ctx context.Context, actor *Actor, resource string, pacienteID uuid.UUID) error {
	scope, err := s.resolveScope(ctx, actor, resource)
	if err != nil {
		return err
	}
	switch scope {
	case entity.DataScopeAll:
		return nil
	case entity.DataScopeSelfPatient:
		if actor.PacienteID == nil || pacienteID != *actor.PacienteID {
			return domainerrors.NewForbiddenError("Acesso negado")
		}
		return nil
	case entity.DataScopeTherapistPatients:
		if actor.ProfissionalID == nil {
			return domainerrors.NewForbiddenError("Acesso negado")
		}
		ok, err := s.userCanAccessPacienteAsTherapist(ctx, *actor.ProfissionalID, pacienteID)
		if err != nil {
			return err
		}
		if !ok {
			return domainerrors.NewForbiddenError("Acesso negado")
		}
		return nil
	case entity.DataScopeUnitPatients:
		if len(actor.UnidadeIDs) == 0 {
			return nil
		}
		ok, err := s.pacienteInUnidades(ctx, pacienteID, actor.UnidadeIDs)
		if err != nil {
			return err
		}
		if !ok {
			return domainerrors.NewForbiddenError("Acesso negado")
		}
		return nil
	default:
		return domainerrors.NewForbiddenError("Acesso negado")
	}
}

func (s *DataScopeService) ApplyConsultaListScope(ctx context.Context, actor *Actor, filter *repository.ConsultaListFilter) error {
	scope, err := s.resolveScope(ctx, actor, "consultas")
	if err != nil {
		return err
	}
	switch scope {
	case entity.DataScopeAll:
		return nil
	case entity.DataScopeSelfPatient:
		if actor.PacienteID == nil || *actor.PacienteID == uuid.Nil {
			return domainerrors.NewForbiddenError("Conta sem paciente vinculado")
		}
		filter.PacienteID = actor.PacienteID
	case entity.DataScopeTherapistPatients:
		if actor.ProfissionalID == nil || *actor.ProfissionalID == uuid.Nil {
			return domainerrors.NewForbiddenError("Conta sem profissional vinculado")
		}
		filter.ProfissionalID = actor.ProfissionalID
	case entity.DataScopeUnitPatients:
		// Consultas filtradas por unidade via query param; escopo de unidade do usuário reforçado no handler se necessário
		return nil
	default:
		return domainerrors.NewForbiddenError("Escopo de acesso inválido")
	}
	return nil
}

func (s *DataScopeService) AssertConsultaPacienteAccess(ctx context.Context, actor *Actor, consultaPacienteID uuid.UUID) error {
	return s.AssertPacienteAccess(ctx, actor, consultaPacienteID)
}

func (s *DataScopeService) userCanAccessPacienteAsTherapist(ctx context.Context, profissionalID, pacienteID uuid.UUID) (bool, error) {
	return s.scopes.PacienteAccessibleByProfissional(ctx, profissionalID, pacienteID)
}

func (s *DataScopeService) pacienteInUnidades(ctx context.Context, pacienteID uuid.UUID, unidadeIDs []uuid.UUID) (bool, error) {
	return s.scopes.PacienteInUnidades(ctx, pacienteID, unidadeIDs)
}
