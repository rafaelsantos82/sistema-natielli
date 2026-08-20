package database

import (
	"context"
	"errors"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresProfissionalDocumentoRepository struct {
	db *gorm.DB
}

func NewPostgresProfissionalDocumentoRepository(db *gorm.DB) *PostgresProfissionalDocumentoRepository {
	return &PostgresProfissionalDocumentoRepository{db: db}
}

func (r *PostgresProfissionalDocumentoRepository) Create(ctx context.Context, doc *entity.ProfissionalDocumento) error {
	m := profissionalDocumentoModel{
		ID:             doc.ID,
		ProfissionalID: doc.ProfissionalID,
		Categoria:      string(doc.Categoria),
		Obrigatorio:    doc.Obrigatorio,
		NomeArquivo:    doc.NomeArquivo,
		MimeType:       doc.MimeType,
		TamanhoBytes:   doc.TamanhoBytes,
		URL:            doc.StoragePath,
		Versao:         doc.Versao,
		Substitui:      doc.Substitui,
		UploadedAt:     doc.UploadedAt,
		UploadedBy:     doc.UploadedBy,
	}
	return r.db.WithContext(ctx).Create(&m).Error
}

func (r *PostgresProfissionalDocumentoRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.ProfissionalDocumento, error) {
	var m profissionalDocumentoModel
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&m).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return profDocModelToEntity(&m), nil
}

func (r *PostgresProfissionalDocumentoRepository) List(ctx context.Context, filter repository.ProfissionalDocumentoListFilter) ([]*entity.ProfissionalDocumento, error) {
	q := r.db.WithContext(ctx).Where("profissional_id = ?", filter.ProfissionalID)
	if filter.Categoria != nil {
		q = q.Where("categoria = ?", string(*filter.Categoria))
	}
	var rows []profissionalDocumentoModel
	if err := q.Order("uploaded_at DESC").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]*entity.ProfissionalDocumento, 0, len(rows))
	for i := range rows {
		out = append(out, profDocModelToEntity(&rows[i]))
	}
	return out, nil
}

func (r *PostgresProfissionalDocumentoRepository) ListAllActive(ctx context.Context) ([]*entity.ProfissionalDocumento, error) {
	var rows []profissionalDocumentoModel
	if err := r.db.WithContext(ctx).Order("uploaded_at DESC").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]*entity.ProfissionalDocumento, 0, len(rows))
	for i := range rows {
		out = append(out, profDocModelToEntity(&rows[i]))
	}
	return out, nil
}

func (r *PostgresProfissionalDocumentoRepository) SoftDelete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&profissionalDocumentoModel{}).Error
}

func profDocModelToEntity(m *profissionalDocumentoModel) *entity.ProfissionalDocumento {
	var deleted *time.Time
	if m.DeletedAt.Valid {
		t := m.DeletedAt.Time
		deleted = &t
	}
	return &entity.ProfissionalDocumento{
		ID:             m.ID,
		ProfissionalID: m.ProfissionalID,
		Categoria:      entity.DocumentoCategoria(m.Categoria),
		Obrigatorio:    m.Obrigatorio,
		NomeArquivo:    m.NomeArquivo,
		MimeType:       m.MimeType,
		TamanhoBytes:   m.TamanhoBytes,
		StoragePath:    m.URL,
		Versao:         m.Versao,
		Substitui:      m.Substitui,
		UploadedAt:     m.UploadedAt,
		UploadedBy:     m.UploadedBy,
		DeletedAt:      deleted,
	}
}
