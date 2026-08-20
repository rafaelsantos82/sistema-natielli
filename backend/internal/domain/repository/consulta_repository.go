package repository

import (
	"context"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"

	"github.com/google/uuid"
)

type ConsultaListFilter struct {
	UnidadeID      *uuid.UUID
	ProfissionalID *uuid.UUID
	PacienteID     *uuid.UUID
	DataInicio     *time.Time
	DataFim        *time.Time
	Page           int
	PageSize       int
}

type ConsultaListItem struct {
	Consulta         *entity.Consulta
	PacienteNome     string
	ProfissionalNome string
	SalaNome         string
}

type ConsultaRepository interface {
	Save(ctx context.Context, c *entity.Consulta) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Consulta, error)
	Update(ctx context.Context, c *entity.Consulta) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter ConsultaListFilter) ([]ConsultaListItem, int64, error)
	FindByIDWithNames(ctx context.Context, id uuid.UUID) (*ConsultaListItem, error)
	PatchAtendimento(ctx context.Context, id uuid.UUID, patch map[string]interface{}) error
	ExistsBySalaID(ctx context.Context, salaID uuid.UUID) (bool, error)
}

type SalaListFilter struct {
	UnidadeID *uuid.UUID
	Query     string
	Status    string
	Page      int
	PageSize  int
}

type SalaRepository interface {
	Save(ctx context.Context, s *entity.Sala) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Sala, error)
	Update(ctx context.Context, s *entity.Sala) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, filter SalaListFilter) ([]*entity.Sala, int64, error)
	GetEspecialidades(ctx context.Context, salaID uuid.UUID) ([]string, error)
	GetRecursos(ctx context.Context, salaID uuid.UUID) ([]string, error)

	ListReservas(ctx context.Context, salaID uuid.UUID) ([]*entity.Reserva, error)
	FindReservaByConsultaID(ctx context.Context, consultaID uuid.UUID) (*entity.Reserva, error)
	FindReservaByID(ctx context.Context, salaID, reservaID uuid.UUID) (*entity.Reserva, error)
	SaveReserva(ctx context.Context, r *entity.Reserva) error
	UpdateReserva(ctx context.Context, r *entity.Reserva) error
	DeleteReserva(ctx context.Context, salaID, reservaID uuid.UUID) error
}

type NotificationSettingsRepository interface {
	FindByUnidadeID(ctx context.Context, unidadeID *uuid.UUID) (*entity.NotificationSettings, error)
	Upsert(ctx context.Context, s *entity.NotificationSettings) error
}
