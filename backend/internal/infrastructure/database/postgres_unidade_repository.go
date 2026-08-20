package database

import (
	"context"
	"errors"
	"strings"

	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresUnidadeRepository struct {
	db *gorm.DB
}

func NewPostgresUnidadeRepository(db *gorm.DB) *PostgresUnidadeRepository {
	return &PostgresUnidadeRepository{db: db}
}

func (r *PostgresUnidadeRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.Unidade, error) {
	var model unidadeModel
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapUnidadeDBError(err)
	}
	return unidadeModelToEntity(&model), nil
}

func (r *PostgresUnidadeRepository) List(ctx context.Context, filter repository.UnidadeListFilter) ([]*entity.Unidade, int64, error) {
	q := r.db.WithContext(ctx).Model(&unidadeModel{})
	if filter.Status != "" {
		q = q.Where("status = ?", filter.Status)
	}
	if filter.Query != "" {
		like := "%" + strings.TrimSpace(filter.Query) + "%"
		q = q.Where("nome ILIKE ? OR slug ILIKE ?", like, like)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, mapUnidadeDBError(err)
	}

	offset := (filter.Page - 1) * filter.PageSize
	var models []unidadeModel
	err := q.Order("nome ASC").Offset(offset).Limit(filter.PageSize).Find(&models).Error
	if err != nil {
		return nil, 0, mapUnidadeDBError(err)
	}

	out := make([]*entity.Unidade, 0, len(models))
	for i := range models {
		out = append(out, unidadeModelToEntity(&models[i]))
	}
	return out, total, nil
}

func unidadeModelToEntity(m *unidadeModel) *entity.Unidade {
	u := &entity.Unidade{
		ID:        m.ID,
		Nome:      m.Nome,
		Slug:      m.Slug,
		Status:    entity.UnidadeStatus(m.Status),
		Endereco:  m.Endereco,
		Telefone:  m.Telefone,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
	if m.DeletedAt.Valid {
		t := m.DeletedAt.Time
		u.DeletedAt = &t
	}
	return u
}

func mapUnidadeDBError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return MapDBError(err)
	}
	return MapDBError(err)
}
