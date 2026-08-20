package database

import (
	"context"
	"errors"
	"time"

	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresDocumentoAssinadoRepository struct {
	db *gorm.DB
}

func NewPostgresDocumentoAssinadoRepository(db *gorm.DB) *PostgresDocumentoAssinadoRepository {
	return &PostgresDocumentoAssinadoRepository{db: db}
}

func (r *PostgresDocumentoAssinadoRepository) Create(ctx context.Context, rec *repository.DocumentoAssinadoRecord) error {
	var org, cpf, orig, signed *string
	if rec.SignerOrg != "" {
		org = &rec.SignerOrg
	}
	if rec.SignerCPF != "" {
		cpf = &rec.SignerCPF
	}
	if rec.OriginalPath != "" {
		orig = &rec.OriginalPath
	}
	if rec.SignedPath != "" {
		signed = &rec.SignedPath
	}
	uid := rec.UnidadeID
	cad := rec.CadastradoPor
	m := documentoAssinadoModel{
		ID:               rec.ID,
		Name:             rec.Name,
		Type:             rec.Type,
		DocumentHash:     rec.DocumentHash,
		Signature:        rec.Signature,
		Certificate:      rec.Certificate,
		SignedAt:         mustParseTime(rec.SignedAt),
		Algorithm:        rec.Algorithm,
		SignerCommonName: rec.SignerCommonName,
		SignerOrg:        org,
		SignerCPF:        cpf,
		CertValidFrom:    mustParseTime(rec.CertValidFrom),
		CertValidTo:      mustParseTime(rec.CertValidTo),
		CertIssuer:       rec.CertIssuer,
		CertSerial:       rec.CertSerial,
		UnidadeID:        &uid,
		CadastradoPor:    &cad,
		OriginalPath:     orig,
		SignedPath:       signed,
		CreatedAt:        time.Now().UTC(),
	}
	return r.db.WithContext(ctx).Create(&m).Error
}

func (r *PostgresDocumentoAssinadoRepository) FindByID(ctx context.Context, id uuid.UUID) (*repository.DocumentoAssinadoRecord, error) {
	var m documentoAssinadoModel
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&m).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return documentoModelToRecord(&m), nil
}

func (r *PostgresDocumentoAssinadoRepository) List(ctx context.Context, filter repository.DocumentoAssinadoListFilter) ([]*repository.DocumentoAssinadoRecord, int64, error) {
	q := r.db.WithContext(ctx).Model(&documentoAssinadoModel{})
	if filter.UnidadeID != uuid.Nil {
		q = q.Where("unidade_id = ?", filter.UnidadeID)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	page := filter.Page
	if page < 1 {
		page = 1
	}
	size := filter.PageSize
	if size < 1 || size > 100 {
		size = 50
	}
	offset := (page - 1) * size
	var rows []documentoAssinadoModel
	if err := q.Order("signed_at DESC").Limit(size).Offset(offset).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	out := make([]*repository.DocumentoAssinadoRecord, 0, len(rows))
	for i := range rows {
		out = append(out, documentoModelToRecord(&rows[i]))
	}
	return out, total, nil
}

func documentoModelToRecord(m *documentoAssinadoModel) *repository.DocumentoAssinadoRecord {
	org, cpf, orig, signed := "", "", "", ""
	if m.SignerOrg != nil {
		org = *m.SignerOrg
	}
	if m.SignerCPF != nil {
		cpf = *m.SignerCPF
	}
	if m.OriginalPath != nil {
		orig = *m.OriginalPath
	}
	if m.SignedPath != nil {
		signed = *m.SignedPath
	}
	uid := uuid.Nil
	if m.UnidadeID != nil {
		uid = *m.UnidadeID
	}
	cad := uuid.Nil
	if m.CadastradoPor != nil {
		cad = *m.CadastradoPor
	}
	return &repository.DocumentoAssinadoRecord{
		ID:               m.ID,
		Name:             m.Name,
		Type:             m.Type,
		DocumentHash:     m.DocumentHash,
		Signature:        m.Signature,
		Certificate:      m.Certificate,
		SignedAt:         m.SignedAt.UTC().Format(time.RFC3339),
		Algorithm:        m.Algorithm,
		SignerCommonName: m.SignerCommonName,
		SignerOrg:        org,
		SignerCPF:        cpf,
		CertValidFrom:    m.CertValidFrom.UTC().Format(time.RFC3339),
		CertValidTo:      m.CertValidTo.UTC().Format(time.RFC3339),
		CertIssuer:       m.CertIssuer,
		CertSerial:       m.CertSerial,
		UnidadeID:        uid,
		CadastradoPor:    cad,
		OriginalPath:     orig,
		SignedPath:       signed,
		CreatedAt:        m.CreatedAt.UTC().Format(time.RFC3339),
	}
}
