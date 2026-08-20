package service

import (
	"context"
	"log/slog"
	"testing"

	"espaco-terapia-os/backend/internal/domain/entity"

	"github.com/google/uuid"
)

func TestUserService_Create_RequiresPacienteForResponsavel(t *testing.T) {
	svc := NewUserService(&stubUserRepo{}, nil, slog.Default())
	_, err := svc.Create(context.Background(), CreateUserInput{
		Name:     "Maria",
		Email:    "maria@example.com",
		Password: "senha_segura",
		Role:     entity.UserRoleResponsavel,
	})
	if err == nil {
		t.Fatal("expected error when responsavel sem paciente_id")
	}
}

func TestUserService_Create_RequiresProfissionalForTerapeuta(t *testing.T) {
	svc := NewUserService(&stubUserRepo{}, nil, slog.Default())
	_, err := svc.Create(context.Background(), CreateUserInput{
		Name:     "Ana",
		Email:    "ana@example.com",
		Password: "senha_segura",
		Role:     entity.UserRoleTerapeuta,
	})
	if err == nil {
		t.Fatal("expected error when terapeuta sem profissional_id")
	}
}

func TestUserService_Create_RejectsPacienteWhenNotResponsavel(t *testing.T) {
	svc := NewUserService(&stubUserRepo{}, nil, slog.Default())
	pid := uuid.New()
	_, err := svc.Create(context.Background(), CreateUserInput{
		Name:       "João",
		Email:      "joao@example.com",
		Password:   "senha_segura",
		Role:       entity.UserRoleFuncionario,
		PacienteID: &pid,
	})
	if err == nil {
		t.Fatal("expected error when paciente_id não é perfil responsável")
	}
}
