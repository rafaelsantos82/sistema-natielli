package database

import (
	"context"

	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"

	"gorm.io/gorm"
)

type PostgresAccessControlRepository struct {
	db *gorm.DB
}

func NewPostgresAccessControlRepository(db *gorm.DB) *PostgresAccessControlRepository {
	return &PostgresAccessControlRepository{db: db}
}

func (r *PostgresAccessControlRepository) HasRolePermission(ctx context.Context, role entity.UserRole, code string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&rolePermissionModel{}).
		Joins("JOIN permissions ON permissions.id = role_permissions.permission_id").
		Where("role_permissions.role = ? AND permissions.code = ?", string(role), code).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *PostgresAccessControlRepository) ListPermissions(ctx context.Context) ([]repository.Permission, error) {
	var models []permissionModel
	if err := r.db.WithContext(ctx).Order("code ASC").Find(&models).Error; err != nil {
		return nil, err
	}
	out := make([]repository.Permission, 0, len(models))
	for _, m := range models {
		out = append(out, repository.Permission{
			Code:        m.Code,
			Resource:    m.Resource,
			Action:      m.Action,
			Description: m.Description,
		})
	}
	return out, nil
}

func (r *PostgresAccessControlRepository) ListRolePermissionCodes(ctx context.Context, role entity.UserRole) ([]string, error) {
	var rows []struct {
		Code string `gorm:"column:code"`
	}
	err := r.db.WithContext(ctx).
		Table("role_permissions").
		Select("permissions.code").
		Joins("JOIN permissions ON permissions.id = role_permissions.permission_id").
		Where("role_permissions.role = ?", string(role)).
		Order("permissions.code ASC").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	codes := make([]string, 0, len(rows))
	for _, row := range rows {
		codes = append(codes, row.Code)
	}
	return codes, nil
}

func (r *PostgresAccessControlRepository) ReplaceRolePermissions(ctx context.Context, role entity.UserRole, codes []string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("role = ?", string(role)).Delete(&rolePermissionModel{}).Error; err != nil {
			return err
		}
		if len(codes) == 0 {
			return nil
		}

		var permissions []permissionModel
		if err := tx.Where("code IN ?", codes).Find(&permissions).Error; err != nil {
			return err
		}
		for _, p := range permissions {
			row := rolePermissionModel{
				Role:         string(role),
				PermissionID: p.ID,
			}
			if err := tx.Create(&row).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
