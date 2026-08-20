package database

import (
	"context"
	"time"

	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type pacienteProfissionalModel struct {
	PacienteID         uuid.UUID  `gorm:"column:paciente_id;primaryKey"`
	ProfissionalID     uuid.UUID  `gorm:"column:profissional_id;primaryKey"`
	Origem             string     `gorm:"column:origem"`
	PrimeiraConsultaID *uuid.UUID `gorm:"column:primeira_consulta_id"`
	CreatedAt          time.Time  `gorm:"column:created_at"`
	UpdatedAt          time.Time  `gorm:"column:updated_at"`
}

func (pacienteProfissionalModel) TableName() string { return "paciente_profissionais" }

type PostgresPacienteProfissionalRepository struct {
	db *gorm.DB
}

func NewPostgresPacienteProfissionalRepository(db *gorm.DB) *PostgresPacienteProfissionalRepository {
	return &PostgresPacienteProfissionalRepository{db: db}
}

func (r *PostgresPacienteProfissionalRepository) Upsert(ctx context.Context, link repository.PacienteProfissionalLink) error {
	now := time.Now().UTC()
	row := pacienteProfissionalModel{
		PacienteID:         link.PacienteID,
		ProfissionalID:     link.ProfissionalID,
		Origem:             link.Origem,
		PrimeiraConsultaID: link.PrimeiraConsultaID,
		CreatedAt:          now,
		UpdatedAt:          now,
	}
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "paciente_id"}, {Name: "profissional_id"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"updated_at": now,
			"origem": gorm.Expr(
				`CASE WHEN EXCLUDED.origem = ? THEN EXCLUDED.origem ELSE paciente_profissionais.origem END`,
				repository.PacienteProfissionalOrigemConsultaRealizada,
			),
		}),
	}).Create(&row).Error
}

func (r *PostgresPacienteProfissionalRepository) Exists(ctx context.Context, pacienteID, profissionalID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&pacienteProfissionalModel{}).
		Where("paciente_id = ? AND profissional_id = ?", pacienteID, profissionalID).
		Count(&count).Error
	return count > 0, err
}
