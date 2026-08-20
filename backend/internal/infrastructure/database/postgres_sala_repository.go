package database

import (
	"context"
	"errors"
	"strings"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresSalaRepository struct {
	db *gorm.DB
}

func NewPostgresSalaRepository(db *gorm.DB) *PostgresSalaRepository {
	return &PostgresSalaRepository{db: db}
}

func (r *PostgresSalaRepository) Save(ctx context.Context, s *entity.Sala) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		model := salaEntityToModel(s)
		if err := tx.Create(&model).Error; err != nil {
			return mapSalaDBError(err)
		}
		if err := saveSalaEspecialidadesTx(tx, s.ID, s.Especialidades); err != nil {
			return err
		}
		return saveSalaRecursosTx(tx, s.ID, s.Recursos)
	})
}

func (r *PostgresSalaRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.Sala, error) {
	var model salaModel
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapSalaDBError(err)
	}
	return salaModelToEntity(&model), nil
}

func (r *PostgresSalaRepository) Update(ctx context.Context, s *entity.Sala) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		model := salaEntityToModel(s)
		if err := tx.Model(&salaModel{}).Where("id = ?", s.ID).Updates(&model).Error; err != nil {
			return mapSalaDBError(err)
		}
		if err := tx.Where("sala_id = ?", s.ID).Delete(&salaEspecialidadeModel{}).Error; err != nil {
			return mapSalaDBError(err)
		}
		if err := saveSalaEspecialidadesTx(tx, s.ID, s.Especialidades); err != nil {
			return err
		}
		if err := tx.Where("sala_id = ?", s.ID).Delete(&salaRecursoModel{}).Error; err != nil {
			return mapSalaDBError(err)
		}
		return saveSalaRecursosTx(tx, s.ID, s.Recursos)
	})
}

func (r *PostgresSalaRepository) Delete(ctx context.Context, id uuid.UUID) error {
	err := r.db.WithContext(ctx).Where("id = ?", id).Delete(&salaModel{}).Error
	return mapSalaDBError(err)
}

func (r *PostgresSalaRepository) List(ctx context.Context, filter repository.SalaListFilter) ([]*entity.Sala, int64, error) {
	q := r.db.WithContext(ctx).Model(&salaModel{})
	if filter.UnidadeID != nil {
		q = q.Where("unidade_id = ?", *filter.UnidadeID)
	}
	if filter.Status != "" {
		q = q.Where("status = ?", filter.Status)
	}
	if filter.Query != "" {
		like := "%" + strings.TrimSpace(filter.Query) + "%"
		q = q.Where("nome_sala ILIKE ? OR codigo ILIKE ?", like, like)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, mapSalaDBError(err)
	}

	offset := (filter.Page - 1) * filter.PageSize
	var models []salaModel
	err := q.Order("nome_sala ASC").Offset(offset).Limit(filter.PageSize).Find(&models).Error
	if err != nil {
		return nil, 0, mapSalaDBError(err)
	}

	out := make([]*entity.Sala, 0, len(models))
	for i := range models {
		out = append(out, salaModelToEntity(&models[i]))
	}
	return out, total, nil
}

func (r *PostgresSalaRepository) GetEspecialidades(ctx context.Context, salaID uuid.UUID) ([]string, error) {
	var models []salaEspecialidadeModel
	if err := r.db.WithContext(ctx).Where("sala_id = ?", salaID).Find(&models).Error; err != nil {
		return nil, mapSalaDBError(err)
	}
	out := make([]string, 0, len(models))
	for _, m := range models {
		out = append(out, m.Especialidade)
	}
	return out, nil
}

func (r *PostgresSalaRepository) GetRecursos(ctx context.Context, salaID uuid.UUID) ([]string, error) {
	var models []salaRecursoModel
	if err := r.db.WithContext(ctx).Where("sala_id = ?", salaID).Find(&models).Error; err != nil {
		return nil, mapSalaDBError(err)
	}
	out := make([]string, 0, len(models))
	for _, m := range models {
		out = append(out, m.Recurso)
	}
	return out, nil
}

func (r *PostgresSalaRepository) ListReservas(ctx context.Context, salaID uuid.UUID) ([]*entity.Reserva, error) {
	var models []reservaModel
	if err := r.db.WithContext(ctx).Where("sala_id = ?", salaID).Order("data_hora_inicio ASC").Find(&models).Error; err != nil {
		return nil, mapSalaDBError(err)
	}
	out := make([]*entity.Reserva, 0, len(models))
	for i := range models {
		out = append(out, reservaModelToEntity(&models[i]))
	}
	return out, nil
}

func (r *PostgresSalaRepository) FindReservaByConsultaID(ctx context.Context, consultaID uuid.UUID) (*entity.Reserva, error) {
	var model reservaModel
	err := r.db.WithContext(ctx).Where("consulta_id = ?", consultaID).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapSalaDBError(err)
	}
	return reservaModelToEntity(&model), nil
}

func (r *PostgresSalaRepository) FindReservaByID(ctx context.Context, salaID, reservaID uuid.UUID) (*entity.Reserva, error) {
	var model reservaModel
	err := r.db.WithContext(ctx).Where("id = ? AND sala_id = ?", reservaID, salaID).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapSalaDBError(err)
	}
	return reservaModelToEntity(&model), nil
}

func (r *PostgresSalaRepository) SaveReserva(ctx context.Context, res *entity.Reserva) error {
	model := reservaEntityToModel(res)
	if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
		return mapSalaDBError(err)
	}
	return nil
}

func (r *PostgresSalaRepository) UpdateReserva(ctx context.Context, res *entity.Reserva) error {
	model := reservaEntityToModel(res)
	if err := r.db.WithContext(ctx).Model(&reservaModel{}).Where("id = ?", res.ID).Updates(&model).Error; err != nil {
		return mapSalaDBError(err)
	}
	return nil
}

func (r *PostgresSalaRepository) DeleteReserva(ctx context.Context, salaID, reservaID uuid.UUID) error {
	err := r.db.WithContext(ctx).Where("id = ? AND sala_id = ?", reservaID, salaID).Delete(&reservaModel{}).Error
	return mapSalaDBError(err)
}

func saveSalaEspecialidadesTx(tx *gorm.DB, salaID uuid.UUID, especialidades []string) error {
	for _, esp := range especialidades {
		esp = strings.TrimSpace(esp)
		if esp == "" {
			continue
		}
		m := salaEspecialidadeModel{SalaID: salaID, Especialidade: esp}
		if err := tx.Create(&m).Error; err != nil {
			return mapSalaDBError(err)
		}
	}
	return nil
}

func saveSalaRecursosTx(tx *gorm.DB, salaID uuid.UUID, recursos []string) error {
	for _, rec := range recursos {
		rec = strings.TrimSpace(rec)
		if rec == "" {
			continue
		}
		m := salaRecursoModel{SalaID: salaID, Recurso: rec}
		if err := tx.Create(&m).Error; err != nil {
			return mapSalaDBError(err)
		}
	}
	return nil
}

func salaEntityToModel(s *entity.Sala) *salaModel {
	return &salaModel{
		ID:         s.ID,
		NomeSala:   s.NomeSala,
		Codigo:     s.Codigo,
		UnidadeID:  s.UnidadeID,
		Capacidade: s.Capacidade,
		Status:     string(s.Status),
		CreatedAt:  s.CreatedAt,
		UpdatedAt:  s.UpdatedAt,
	}
}

func salaModelToEntity(m *salaModel) *entity.Sala {
	return &entity.Sala{
		ID:         m.ID,
		NomeSala:   m.NomeSala,
		Codigo:     m.Codigo,
		UnidadeID:  m.UnidadeID,
		Capacidade: m.Capacidade,
		Status:     entity.SalaStatus(m.Status),
		CreatedAt:  m.CreatedAt,
		UpdatedAt:  m.UpdatedAt,
	}
}

func reservaEntityToModel(r *entity.Reserva) *reservaModel {
	return &reservaModel{
		ID:               r.ID,
		SalaID:           r.SalaID,
		DataHoraInicio:   r.DataHoraInicio,
		Duracao:          r.Duracao,
		ProfissionalID:   r.ProfissionalID,
		ProfissionalNome: r.ProfissionalNome,
		ConsultaID:       r.ConsultaID,
		TipoAtendimento:  r.TipoAtendimento,
		Observacoes:      r.Observacoes,
		RRule:            r.RRule,
		CreatedAt:        r.CreatedAt,
	}
}

func reservaModelToEntity(m *reservaModel) *entity.Reserva {
	return &entity.Reserva{
		ID:               m.ID,
		SalaID:           m.SalaID,
		DataHoraInicio:   m.DataHoraInicio,
		Duracao:          m.Duracao,
		ProfissionalID:   m.ProfissionalID,
		ProfissionalNome: m.ProfissionalNome,
		ConsultaID:       m.ConsultaID,
		TipoAtendimento:  m.TipoAtendimento,
		Observacoes:      m.Observacoes,
		RRule:            m.RRule,
		CreatedAt:        m.CreatedAt,
	}
}

func mapSalaDBError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return domainerrors.NewNotFoundError("Sala", "")
	}
	return MapDBError(err)
}
