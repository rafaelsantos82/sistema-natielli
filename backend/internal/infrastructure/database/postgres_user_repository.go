package database

import (
	"context"
	"errors"
	"strings"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresUserRepository struct {
	db *gorm.DB
}

func NewPostgresUserRepository(db *gorm.DB) *PostgresUserRepository {
	return &PostgresUserRepository{db: db}
}

func (r *PostgresUserRepository) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	var model userModel
	err := r.db.WithContext(ctx).
		Where("LOWER(email) = ?", strings.ToLower(strings.TrimSpace(email))).
		First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapUserDBError(err)
	}
	return r.modelToEntity(ctx, &model)
}

func (r *PostgresUserRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	var model userModel
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapUserDBError(err)
	}
	return r.modelToEntity(ctx, &model)
}

func (r *PostgresUserRepository) FindByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	var model userModel
	err := r.db.WithContext(ctx).Unscoped().Where("id = ?", id).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapUserDBError(err)
	}
	return r.modelToEntity(ctx, &model)
}

func (r *PostgresUserRepository) List(ctx context.Context, filter repository.UserListFilter) ([]*entity.User, int64, error) {
	q := r.db.WithContext(ctx).Model(&userModel{})
	if filter.IncludeDeleted {
		q = q.Unscoped()
	}
	q = q.Where("id <> ?", entity.SystemUserID)
	if filter.Query != "" {
		like := "%" + strings.TrimSpace(filter.Query) + "%"
		q = q.Where("name ILIKE ? OR email ILIKE ?", like, like)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, mapUserDBError(err)
	}

	offset := (filter.Page - 1) * filter.PageSize
	var models []userModel
	err := q.Order("name ASC").Offset(offset).Limit(filter.PageSize).Find(&models).Error
	if err != nil {
		return nil, 0, mapUserDBError(err)
	}

	out := make([]*entity.User, 0, len(models))
	for i := range models {
		u, err := r.modelToEntity(ctx, &models[i])
		if err != nil {
			return nil, 0, err
		}
		out = append(out, u)
	}
	return out, total, nil
}

func (r *PostgresUserRepository) Create(ctx context.Context, user *entity.User) error {
	model := userEntityToModel(user)
	err := r.db.WithContext(ctx).Create(&model).Error
	if err != nil {
		return mapUserDBError(err)
	}
	return r.ReplaceUnidades(ctx, user.ID, user.UnidadeIDs)
}

func (r *PostgresUserRepository) Update(ctx context.Context, user *entity.User) error {
	model := userEntityToModel(user)
	err := r.db.WithContext(ctx).Model(&userModel{}).
		Where("id = ?", user.ID).
		Updates(map[string]interface{}{
			"name":                 model.Name,
			"email":                model.Email,
			"password_hash":        model.PasswordHash,
			"role":                 model.Role,
			"paciente_id":          model.PacienteID,
			"profissional_id":      model.ProfissionalID,
			"must_change_password": user.MustChangePassword,
		}).Error
	if err != nil {
		return mapUserDBError(err)
	}
	return r.ReplaceUnidades(ctx, user.ID, user.UnidadeIDs)
}

func (r *PostgresUserRepository) SoftDelete(ctx context.Context, id uuid.UUID) error {
	res := r.db.WithContext(ctx).Where("id = ?", id).Delete(&userModel{})
	if res.Error != nil {
		return mapUserDBError(res.Error)
	}
	if res.RowsAffected == 0 {
		return domainerrors.NewNotFoundError("Usuário", id.String())
	}
	return nil
}

func (r *PostgresUserRepository) Restore(ctx context.Context, id uuid.UUID) error {
	now := time.Now().UTC()
	res := r.db.WithContext(ctx).Unscoped().Model(&userModel{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"deleted_at": nil,
			"updated_at": now,
		})
	if res.Error != nil {
		return mapUserDBError(res.Error)
	}
	if res.RowsAffected == 0 {
		return domainerrors.NewNotFoundError("Usuário", id.String())
	}
	return nil
}

func (r *PostgresUserRepository) ReplaceUnidades(ctx context.Context, userID uuid.UUID, unidadeIDs []uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userID).Delete(&userUnidadeModel{}).Error; err != nil {
			return err
		}
		for _, uid := range unidadeIDs {
			if uid == uuid.Nil {
				continue
			}
			row := userUnidadeModel{UserID: userID, UnidadeID: uid}
			if err := tx.Create(&row).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *PostgresUserRepository) CountActiveAdmins(ctx context.Context, excludeUserID *uuid.UUID) (int64, error) {
	q := r.db.WithContext(ctx).Model(&userModel{}).
		Where("role = ?", string(entity.UserRoleAdmin))
	if excludeUserID != nil {
		q = q.Where("id <> ?", *excludeUserID)
	}
	var count int64
	err := q.Count(&count).Error
	return count, mapUserDBError(err)
}

func (r *PostgresUserRepository) loadUnidadeIDs(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	var rows []userUnidadeModel
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&rows).Error; err != nil {
		return nil, mapUserDBError(err)
	}
	ids := make([]uuid.UUID, 0, len(rows))
	for _, row := range rows {
		ids = append(ids, row.UnidadeID)
	}
	return ids, nil
}

func (r *PostgresUserRepository) modelToEntity(ctx context.Context, m *userModel) (*entity.User, error) {
	ids, err := r.loadUnidadeIDs(ctx, m.ID)
	if err != nil {
		return nil, err
	}
	u := &entity.User{
		ID:                 m.ID,
		Name:               m.Name,
		Email:              m.Email,
		PasswordHash:       m.PasswordHash,
		Role:               entity.UserRole(m.Role),
		PacienteID:         m.PacienteID,
		ProfissionalID:     m.ProfissionalID,
		MustChangePassword: m.MustChangePassword,
		UnidadeIDs:         ids,
		CreatedAt:          m.CreatedAt,
		UpdatedAt:          m.UpdatedAt,
	}
	if m.DeletedAt.Valid {
		t := m.DeletedAt.Time
		u.DeletedAt = &t
	}
	return u, nil
}

func userEntityToModel(u *entity.User) userModel {
	return userModel{
		ID:                 u.ID,
		Name:               u.Name,
		Email:              strings.ToLower(strings.TrimSpace(u.Email)),
		PasswordHash:       u.PasswordHash,
		Role:               string(u.Role),
		PacienteID:         u.PacienteID,
		ProfissionalID:     u.ProfissionalID,
		MustChangePassword: u.MustChangePassword,
	}
}

func mapUserDBError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return domainerrors.NewConflictError("e-mail já cadastrado")
	}
	if strings.Contains(err.Error(), "uq_users_email") || strings.Contains(err.Error(), "duplicate key") {
		return domainerrors.NewConflictError("e-mail já cadastrado")
	}
	return err
}
