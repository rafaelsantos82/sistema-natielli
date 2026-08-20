package database

import (
	"context"
	"errors"
	"reflect"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PostgresCRUDRepo implementa CRUD genérico para modelos GORM com coluna id UUID.
type PostgresCRUDRepo[T any] struct {
	db         *gorm.DB
	entityName string
	listCfg    crudListConfig
}

func NewPostgresCRUDRepo[T any](db *gorm.DB, entityName string, listCfg crudListConfig) *PostgresCRUDRepo[T] {
	return &PostgresCRUDRepo[T]{db: db, entityName: entityName, listCfg: listCfg}
}

func (r *PostgresCRUDRepo[T]) Save(ctx context.Context, entity *T) error {
	if err := r.db.WithContext(ctx).Create(entity).Error; err != nil {
		return mapWaveDBError(r.entityName, err)
	}
	return nil
}

func (r *PostgresCRUDRepo[T]) FindByID(ctx context.Context, id uuid.UUID) (*T, error) {
	var model T
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapWaveDBError(r.entityName, err)
	}
	return &model, nil
}

func (r *PostgresCRUDRepo[T]) Update(ctx context.Context, entity *T) error {
	id, err := extractUUIDID(entity)
	if err != nil {
		return err
	}
	if err := r.db.WithContext(ctx).Model(entity).Where("id = ?", id).Updates(entity).Error; err != nil {
		return mapWaveDBError(r.entityName, err)
	}
	return nil
}

func (r *PostgresCRUDRepo[T]) Delete(ctx context.Context, id uuid.UUID) error {
	var model T
	if err := r.db.WithContext(ctx).Where("id = ?", id).Delete(&model).Error; err != nil {
		return mapWaveDBError(r.entityName, err)
	}
	return nil
}

func (r *PostgresCRUDRepo[T]) List(ctx context.Context, filter repository.CRUDListFilter) ([]*T, int64, error) {
	filter.Page, filter.PageSize = service.NormalizePagination(filter.Page, filter.PageSize)

	var model T
	q := applyCRUDListFilter(r.db.WithContext(ctx).Model(&model), filter, r.listCfg)

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, mapWaveDBError(r.entityName, err)
	}

	order := r.listCfg.orderBy
	if order == "" {
		order = "created_at DESC"
	}
	offset := (filter.Page - 1) * filter.PageSize
	var models []T
	err := q.Order(order).Offset(offset).Limit(filter.PageSize).Find(&models).Error
	if err != nil {
		return nil, 0, mapWaveDBError(r.entityName, err)
	}

	out := make([]*T, 0, len(models))
	for i := range models {
		out = append(out, &models[i])
	}
	return out, total, nil
}

func extractUUIDID(entity any) (uuid.UUID, error) {
	v := reflect.ValueOf(entity)
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}
	f := v.FieldByName("ID")
	if !f.IsValid() {
		return uuid.Nil, domainerrors.NewDatabaseError("modelo sem campo ID", nil)
	}
	id, ok := f.Interface().(uuid.UUID)
	if !ok {
		return uuid.Nil, domainerrors.NewDatabaseError("campo ID inválido", nil)
	}
	return id, nil
}

func mapWaveDBError(entityName string, err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return domainerrors.NewNotFoundError(entityName, "")
	}
	return MapDBError(err)
}

// PostgresCodigoRepo CRUD para entidades com PK string (contas contábeis).
type PostgresCodigoRepo struct {
	db *gorm.DB
}

func NewPostgresCodigoRepo(db *gorm.DB) *PostgresCodigoRepo {
	return &PostgresCodigoRepo{db: db}
}

func (r *PostgresCodigoRepo) Save(ctx context.Context, m *contaContabilModel) error {
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return mapWaveDBError("ContaContabil", err)
	}
	return nil
}

func (r *PostgresCodigoRepo) FindByCodigo(ctx context.Context, codigo string) (*contaContabilModel, error) {
	var model contaContabilModel
	err := r.db.WithContext(ctx).Where("codigo = ?", codigo).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapWaveDBError("ContaContabil", err)
	}
	return &model, nil
}

func (r *PostgresCodigoRepo) Update(ctx context.Context, m *contaContabilModel) error {
	if err := r.db.WithContext(ctx).Model(m).Where("codigo = ?", m.Codigo).Updates(m).Error; err != nil {
		return mapWaveDBError("ContaContabil", err)
	}
	return nil
}

func (r *PostgresCodigoRepo) Delete(ctx context.Context, codigo string) error {
	if err := r.db.WithContext(ctx).Where("codigo = ?", codigo).Delete(&contaContabilModel{}).Error; err != nil {
		return mapWaveDBError("ContaContabil", err)
	}
	return nil
}

func (r *PostgresCodigoRepo) List(ctx context.Context, filter repository.CRUDListFilter) ([]*contaContabilModel, int64, error) {
	filter.Page, filter.PageSize = service.NormalizePagination(filter.Page, filter.PageSize)
	q := r.db.WithContext(ctx).Model(&contaContabilModel{})
	if filter.Query != "" {
		like := "%" + filter.Query + "%"
		q = q.Where("codigo ILIKE ? OR nome ILIKE ?", like, like)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, mapWaveDBError("ContaContabil", err)
	}
	offset := (filter.Page - 1) * filter.PageSize
	var models []contaContabilModel
	err := q.Order("codigo ASC").Offset(offset).Limit(filter.PageSize).Find(&models).Error
	if err != nil {
		return nil, 0, mapWaveDBError("ContaContabil", err)
	}
	out := make([]*contaContabilModel, 0, len(models))
	for i := range models {
		out = append(out, &models[i])
	}
	return out, total, nil
}

// PostgresAuditRepo append-only para audit_log.
type PostgresAuditRepo struct {
	db *gorm.DB
}

func NewPostgresAuditRepo(db *gorm.DB) *PostgresAuditRepo {
	return &PostgresAuditRepo{db: db}
}

func (r *PostgresAuditRepo) Append(ctx context.Context, m *auditLogModel) error {
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return mapWaveDBError("AuditLog", err)
	}
	return nil
}

func (r *PostgresAuditRepo) List(ctx context.Context, filter repository.CRUDListFilter) ([]*auditLogModel, int64, error) {
	filter.Page, filter.PageSize = service.NormalizePagination(filter.Page, filter.PageSize)
	q := r.db.WithContext(ctx).Model(&auditLogModel{})
	if filter.Entidade != "" {
		q = q.Where("entidade = ?", filter.Entidade)
	}
	if filter.EntidadeID != "" {
		q = q.Where("entidade_id = ?", filter.EntidadeID)
	}
	if filter.Query != "" {
		like := "%" + filter.Query + "%"
		q = q.Where("entidade ILIKE ? OR entidade_id ILIKE ? OR actor_name ILIKE ?", like, like, like)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, mapWaveDBError("AuditLog", err)
	}
	offset := (filter.Page - 1) * filter.PageSize
	var models []auditLogModel
	err := q.Order("timestamp_utc DESC").Offset(offset).Limit(filter.PageSize).Find(&models).Error
	if err != nil {
		return nil, 0, mapWaveDBError("AuditLog", err)
	}
	out := make([]*auditLogModel, 0, len(models))
	for i := range models {
		out = append(out, &models[i])
	}
	return out, total, nil
}
