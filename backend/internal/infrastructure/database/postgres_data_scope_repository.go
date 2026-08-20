package database

import (
	"context"
	"errors"

	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresDataScopeRepository struct {
	db *gorm.DB
}

func NewPostgresDataScopeRepository(db *gorm.DB) *PostgresDataScopeRepository {
	return &PostgresDataScopeRepository{db: db}
}

func (r *PostgresDataScopeRepository) GetRoleResourceScope(ctx context.Context, role entity.UserRole, resource string) (string, error) {
	if role == entity.UserRoleAdmin {
		return entity.DataScopeAll, nil
	}
	var scopeCode string
	err := r.db.WithContext(ctx).
		Table("role_resource_scopes").
		Select("scope_code").
		Where("role = ? AND resource = ?", string(role), resource).
		Scan(&scopeCode).Error
	if errors.Is(err, gorm.ErrRecordNotFound) || scopeCode == "" {
		return entity.DataScopeAll, nil
	}
	if err != nil {
		return "", err
	}
	return scopeCode, nil
}

func (r *PostgresDataScopeRepository) ListRoleResourceScopes(ctx context.Context, role entity.UserRole) ([]repository.RoleResourceScope, error) {
	var rows []repository.RoleResourceScope
	err := r.db.WithContext(ctx).
		Table("role_resource_scopes").
		Select("resource, scope_code").
		Where("role = ?", string(role)).
		Order("resource ASC").
		Scan(&rows).Error
	return rows, err
}

func (r *PostgresDataScopeRepository) ReplaceRoleResourceScopes(ctx context.Context, role entity.UserRole, scopes []repository.RoleResourceScope) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(`DELETE FROM role_resource_scopes WHERE role = ?`, string(role)).Error; err != nil {
			return err
		}
		for _, s := range scopes {
			if s.Resource == "" || !entity.DataScopeValid(s.ScopeCode) {
				continue
			}
			if err := tx.Exec(
				`INSERT INTO role_resource_scopes (role, resource, scope_code) VALUES (?, ?, ?) ON CONFLICT (role, resource) DO UPDATE SET scope_code = EXCLUDED.scope_code`,
				string(role), s.Resource, s.ScopeCode,
			).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *PostgresDataScopeRepository) ListDataScopes(ctx context.Context) ([]repository.DataScopeCatalogEntry, error) {
	var rows []repository.DataScopeCatalogEntry
	err := r.db.WithContext(ctx).Table("data_scopes").Order("code ASC").Find(&rows).Error
	return rows, err
}

func (r *PostgresDataScopeRepository) PacienteAccessibleByProfissional(ctx context.Context, profissionalID, pacienteID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Table("paciente_profissionais").
		Where("paciente_id = ? AND profissional_id = ?", pacienteID, profissionalID).
		Count(&count).Error
	return count > 0, err
}

func (r *PostgresDataScopeRepository) PacienteInUnidades(ctx context.Context, pacienteID uuid.UUID, unidadeIDs []uuid.UUID) (bool, error) {
	if len(unidadeIDs) == 0 {
		return true, nil
	}
	var count int64
	err := r.db.WithContext(ctx).Table("paciente_unidades").
		Where("paciente_id = ? AND ativo = TRUE AND unidade_id IN ?", pacienteID, unidadeIDs).
		Count(&count).Error
	return count > 0, err
}
