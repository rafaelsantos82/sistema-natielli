package database

import (
	"context"
	"errors"
	"time"

	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresChaveDigitalRepository struct {
	db *gorm.DB
}

func NewPostgresChaveDigitalRepository(db *gorm.DB) *PostgresChaveDigitalRepository {
	return &PostgresChaveDigitalRepository{db: db}
}

func (r *PostgresChaveDigitalRepository) FindActiveByUnidade(ctx context.Context, unidadeID uuid.UUID) (*repository.ChaveDigitalRecord, error) {
	var m chaveDigitalModel
	err := r.db.WithContext(ctx).
		Where("unidade_id = ? AND revogada_em IS NULL", unidadeID).
		Order("created_at DESC").
		First(&m).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return chaveModelToRecord(&m), nil
}

func (r *PostgresChaveDigitalRepository) RevokeActiveByUnidade(ctx context.Context, unidadeID uuid.UUID) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).Model(&chaveDigitalModel{}).
		Where("unidade_id = ? AND revogada_em IS NULL", unidadeID).
		Update("revogada_em", now).Error
}

func (r *PostgresChaveDigitalRepository) Create(ctx context.Context, rec *repository.ChaveDigitalRecord) error {
	var org, cpf *string
	if rec.SignerOrg != "" {
		org = &rec.SignerOrg
	}
	if rec.SignerCPF != "" {
		cpf = &rec.SignerCPF
	}
	m := chaveDigitalModel{
		ID:                    rec.ID,
		UnidadeID:             rec.UnidadeID,
		SignerCommonName:      rec.SignerCommonName,
		SignerOrg:             org,
		SignerCPF:             cpf,
		CertValidFrom:         mustParseTime(rec.CertValidFrom),
		CertValidTo:           mustParseTime(rec.CertValidTo),
		CertIssuer:            rec.CertIssuer,
		CertSerial:            rec.CertSerial,
		Algoritmo:             rec.Algoritmo,
		PfxCiphertext:         rec.PfxCiphertext,
		PfxPasswordCiphertext: rec.PfxPasswordCT,
		EncryptionKeyID:       rec.EncryptionKeyID,
		CadastradaPor:         rec.CadastradaPor,
		CreatedAt:             time.Now().UTC(),
		UpdatedAt:             time.Now().UTC(),
	}
	return r.db.WithContext(ctx).Create(&m).Error
}

func chaveModelToRecord(m *chaveDigitalModel) *repository.ChaveDigitalRecord {
	org := ""
	if m.SignerOrg != nil {
		org = *m.SignerOrg
	}
	cpf := ""
	if m.SignerCPF != nil {
		cpf = *m.SignerCPF
	}
	return &repository.ChaveDigitalRecord{
		ID:               m.ID,
		UnidadeID:        m.UnidadeID,
		SignerCommonName: m.SignerCommonName,
		SignerOrg:        org,
		SignerCPF:        cpf,
		CertValidFrom:    m.CertValidFrom.UTC().Format(time.RFC3339),
		CertValidTo:      m.CertValidTo.UTC().Format(time.RFC3339),
		CertIssuer:       m.CertIssuer,
		CertSerial:       m.CertSerial,
		Algoritmo:        m.Algoritmo,
		PfxCiphertext:    m.PfxCiphertext,
		PfxPasswordCT:    m.PfxPasswordCiphertext,
		EncryptionKeyID:  m.EncryptionKeyID,
		CadastradaPor:    m.CadastradaPor,
	}
}

func mustParseTime(s string) time.Time {
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		t, _ = time.Parse("2006-01-02T15:04:05Z07:00", s)
	}
	return t.UTC()
}
