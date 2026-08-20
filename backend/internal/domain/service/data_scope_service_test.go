package service

import (
	"context"
	"testing"

	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type scopeRepoStub struct {
	byResource map[string]string
}

func (s *scopeRepoStub) GetRoleResourceScope(_ context.Context, _ entity.UserRole, resource string) (string, error) {
	if code, ok := s.byResource[resource]; ok {
		return code, nil
	}
	return entity.DataScopeAll, nil
}
func (s *scopeRepoStub) ListRoleResourceScopes(context.Context, entity.UserRole) ([]repository.RoleResourceScope, error) {
	return nil, nil
}
func (s *scopeRepoStub) ReplaceRoleResourceScopes(context.Context, entity.UserRole, []repository.RoleResourceScope) error {
	return nil
}
func (s *scopeRepoStub) ListDataScopes(context.Context) ([]repository.DataScopeCatalogEntry, error) {
	return nil, nil
}
func (s *scopeRepoStub) PacienteAccessibleByProfissional(context.Context, uuid.UUID, uuid.UUID) (bool, error) {
	return true, nil
}
func (s *scopeRepoStub) PacienteInUnidades(context.Context, uuid.UUID, []uuid.UUID) (bool, error) {
	return true, nil
}

func TestDataScopeService_ApplyConsultaListScope_SelfPatient(t *testing.T) {
	pid := uuid.New()
	actor := &Actor{Role: entity.UserRoleResponsavel, PacienteID: &pid}
	svc := NewDataScopeService(&scopeRepoStub{byResource: map[string]string{"consultas": entity.DataScopeSelfPatient}}, nil)
	filter := repository.ConsultaListFilter{}
	if err := svc.ApplyConsultaListScope(context.Background(), actor, &filter); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if filter.PacienteID == nil || *filter.PacienteID != pid {
		t.Fatalf("expected paciente filter, got %+v", filter.PacienteID)
	}
}

func TestDataScopeService_AssertPacienteAccess_DeniesOtherPatient(t *testing.T) {
	linked := uuid.New()
	other := uuid.New()
	actor := &Actor{Role: entity.UserRoleResponsavel, PacienteID: &linked}
	svc := NewDataScopeService(&scopeRepoStub{byResource: map[string]string{"pacientes": entity.DataScopeSelfPatient}}, nil)
	if err := svc.AssertPacienteAccess(context.Background(), actor, other); err == nil {
		t.Fatal("expected forbidden for other patient")
	}
}
