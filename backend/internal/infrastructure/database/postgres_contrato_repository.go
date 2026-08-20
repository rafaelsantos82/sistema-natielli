package database

import (
	"context"
	"errors"
	"strings"
	"time"

	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresContratoRepository struct {
	db *gorm.DB
}

func NewPostgresContratoRepository(db *gorm.DB) *PostgresContratoRepository {
	return &PostgresContratoRepository{db: db}
}

func (r *PostgresContratoRepository) List(ctx context.Context, q, status string, page, pageSize int) ([]*repository.ContratoRecord, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 200 {
		pageSize = 50
	}
	db := r.db.WithContext(ctx).Model(&contratoEvolutionModel{}).Where("deleted_at IS NULL")
	if status != "" {
		db = db.Where("status = ?", status)
	}
	if q = strings.TrimSpace(q); q != "" {
		like := "%" + q + "%"
		db = db.Where("titulo ILIKE ? OR paciente_nome ILIKE ? OR profissional_nome ILIKE ?", like, like, like)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []contratoEvolutionModel
	offset := (page - 1) * pageSize
	if err := db.Order("criado_em DESC").Offset(offset).Limit(pageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	out := make([]*repository.ContratoRecord, 0, len(rows))
	for i := range rows {
		out = append(out, contratoModelToRecord(&rows[i]))
	}
	return out, total, nil
}

func (r *PostgresContratoRepository) GetByID(ctx context.Context, id uuid.UUID) (*repository.ContratoRecord, error) {
	var m contratoEvolutionModel
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&m).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return contratoModelToRecord(&m), nil
}

func (r *PostgresContratoRepository) Create(ctx context.Context, rec *repository.ContratoRecord) error {
	m := recordToContratoModel(rec)
	return r.db.WithContext(ctx).Create(&m).Error
}

func (r *PostgresContratoRepository) Update(ctx context.Context, rec *repository.ContratoRecord) error {
	m := recordToContratoModel(rec)
	return r.db.WithContext(ctx).Save(&m).Error
}

func (r *PostgresContratoRepository) SoftDelete(ctx context.Context, id uuid.UUID, at time.Time) error {
	return r.db.WithContext(ctx).Model(&contratoEvolutionModel{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Update("deleted_at", at).Error
}

func (r *PostgresContratoRepository) CreateCompartilhamento(ctx context.Context, rec *repository.CompartilhamentoRecord) error {
	m := compartilhamentoContratoModel{
		ID: rec.ID, ContratoID: rec.ContratoID, ContratoTitulo: rec.ContratoTitulo,
		Token: rec.Token, ExpiraEm: rec.ExpiraEm, PodeVisualizar: rec.PodeVisualizar,
		PodeBaixar: rec.PodeBaixar, CriadoEm: time.Now().UTC(),
	}
	return r.db.WithContext(ctx).Create(&m).Error
}

func (r *PostgresContratoRepository) FindCompartilhamentoByToken(ctx context.Context, token string) (*repository.CompartilhamentoRecord, error) {
	var m compartilhamentoContratoModel
	err := r.db.WithContext(ctx).Where("token = ?", token).First(&m).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &repository.CompartilhamentoRecord{
		ID: m.ID, ContratoID: m.ContratoID, ContratoTitulo: m.ContratoTitulo,
		Token: m.Token, ExpiraEm: m.ExpiraEm, PodeVisualizar: m.PodeVisualizar, PodeBaixar: m.PodeBaixar,
	}, nil
}

func (r *PostgresContratoRepository) RecordCompartilhamentoAcesso(ctx context.Context, compartilhamentoID uuid.UUID, ip string) error {
	m := compartilhamentoAcessoModel{
		ID: uuid.New(), CompartilhamentoID: compartilhamentoID, DataHora: time.Now().UTC(),
	}
	if ip != "" {
		return r.db.WithContext(ctx).Exec(
			`INSERT INTO compartilhamento_acessos (id, compartilhamento_id, data_hora, ip) VALUES (?, ?, ?, ?::inet)`,
			m.ID, m.CompartilhamentoID, m.DataHora, ip,
		).Error
	}
	return r.db.WithContext(ctx).Create(&m).Error
}

func (r *PostgresContratoRepository) CreateSolicitacao(ctx context.Context, rec *repository.SolicitacaoAssinaturaRecord) error {
	m := solicitacaoAssinaturaModel{
		ID: rec.ID, ContratoID: rec.ContratoID, ContratoTitulo: rec.ContratoTitulo,
		Status: rec.Status, MensagemPersonalizada: rec.MensagemPersonalizada, ExpiraEm: rec.ExpiraEm,
		CriadoEm: time.Now().UTC(), AtualizadoEm: time.Now().UTC(),
	}
	return r.db.WithContext(ctx).Create(&m).Error
}

func (r *PostgresContratoRepository) CreateSignatario(ctx context.Context, rec *repository.SignatarioRecord) error {
	m := signatarioModel{
		ID: rec.ID, SolicitacaoID: rec.SolicitacaoID, Nome: rec.Nome, Email: rec.Email,
		Tipo: rec.Tipo, CPF: rec.CPF, Parentesco: rec.Parentesco, Ordem: rec.Ordem,
		Status: rec.Status, TokenAcesso: strPtr(rec.TokenAcesso), ExpiraEm: rec.ExpiraEm,
	}
	return r.db.WithContext(ctx).Create(&m).Error
}

func (r *PostgresContratoRepository) FindSignatarioByToken(ctx context.Context, token string) (*repository.SignatarioRecord, *repository.ContratoRecord, error) {
	var sm signatarioModel
	if err := r.db.WithContext(ctx).Where("token_acesso = ?", token).First(&sm).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, nil
		}
		return nil, nil, err
	}
	var sol solicitacaoAssinaturaModel
	if err := r.db.WithContext(ctx).Where("id = ?", sm.SolicitacaoID).First(&sol).Error; err != nil {
		return nil, nil, err
	}
	contrato, err := r.GetByID(ctx, sol.ContratoID)
	if err != nil {
		return nil, nil, err
	}
	return signatarioModelToRecord(&sm), contrato, nil
}

func (r *PostgresContratoRepository) UpdateSignatarioStatus(ctx context.Context, id uuid.UUID, status string, assinadoEm time.Time, ip string) error {
	updates := map[string]interface{}{"status": status, "assinado_em": assinadoEm}
	if ip != "" {
		updates["ip"] = ip
	}
	return r.db.WithContext(ctx).Model(&signatarioModel{}).Where("id = ?", id).Updates(updates).Error
}

func (r *PostgresContratoRepository) CountSignatariosPendentes(ctx context.Context, solicitacaoID uuid.UUID) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&signatarioModel{}).
		Where("solicitacao_id = ? AND status NOT IN ?", solicitacaoID, []string{"Assinado", "Recusado"}).
		Count(&n).Error
	return n, err
}

func (r *PostgresContratoRepository) GetSolicitacaoByContrato(ctx context.Context, contratoID uuid.UUID) (*repository.SolicitacaoAssinaturaRecord, error) {
	var m solicitacaoAssinaturaModel
	err := r.db.WithContext(ctx).Where("contrato_id = ?", contratoID).Order("criado_em DESC").First(&m).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &repository.SolicitacaoAssinaturaRecord{
		ID: m.ID, ContratoID: m.ContratoID, ContratoTitulo: m.ContratoTitulo,
		Status: m.Status, MensagemPersonalizada: m.MensagemPersonalizada, ExpiraEm: m.ExpiraEm,
	}, nil
}

func (r *PostgresContratoRepository) UpdateContratoStatus(ctx context.Context, id uuid.UUID, status string) error {
	return r.db.WithContext(ctx).Model(&contratoEvolutionModel{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{"status": status, "atualizado_em": time.Now().UTC()}).Error
}

func contratoModelToRecord(m *contratoEvolutionModel) *repository.ContratoRecord {
	rec := &repository.ContratoRecord{
		ID: m.ID, Titulo: m.Titulo, Tipo: m.Tipo, PacienteID: m.PacienteID,
		PacienteNome: m.PacienteNome, ProfissionalID: m.ProfissionalID, ProfissionalNome: m.ProfissionalNome,
		Status: m.Status, CriadoPor: m.CriadoPor,
		CriadoEm: m.CriadoEm, AtualizadoEm: m.AtualizadoEm, DeletedAt: m.DeletedAt,
	}
	if m.Conteudo != nil {
		rec.Conteudo = *m.Conteudo
	}
	if m.ArquivoNome != nil {
		rec.ArquivoNome = *m.ArquivoNome
	}
	if m.ArquivoMime != nil {
		rec.ArquivoMime = *m.ArquivoMime
	}
	if m.ArquivoTamanhoBytes != nil {
		rec.ArquivoTamanhoBytes = *m.ArquivoTamanhoBytes
	}
	if m.StoragePath != nil {
		rec.StoragePath = *m.StoragePath
	}
	return rec
}

func recordToContratoModel(rec *repository.ContratoRecord) contratoEvolutionModel {
	m := contratoEvolutionModel{
		ID: rec.ID, Titulo: rec.Titulo, Tipo: rec.Tipo, PacienteID: rec.PacienteID,
		PacienteNome: rec.PacienteNome, ProfissionalID: rec.ProfissionalID, ProfissionalNome: rec.ProfissionalNome,
		Status: rec.Status, CriadoPor: rec.CriadoPor,
		CriadoEm: rec.CriadoEm, AtualizadoEm: rec.AtualizadoEm, DeletedAt: rec.DeletedAt,
	}
	if rec.Conteudo != "" {
		c := rec.Conteudo
		m.Conteudo = &c
	}
	if rec.ArquivoNome != "" {
		n := rec.ArquivoNome
		m.ArquivoNome = &n
	}
	if rec.ArquivoMime != "" {
		mt := rec.ArquivoMime
		m.ArquivoMime = &mt
	}
	if rec.ArquivoTamanhoBytes > 0 {
		sz := rec.ArquivoTamanhoBytes
		m.ArquivoTamanhoBytes = &sz
	}
	if rec.StoragePath != "" {
		sp := rec.StoragePath
		m.StoragePath = &sp
	}
	return m
}

func signatarioModelToRecord(m *signatarioModel) *repository.SignatarioRecord {
	rec := &repository.SignatarioRecord{
		ID: m.ID, SolicitacaoID: m.SolicitacaoID, Nome: m.Nome, Email: m.Email,
		Tipo: m.Tipo, CPF: m.CPF, Parentesco: m.Parentesco, Ordem: m.Ordem, Status: m.Status,
		ExpiraEm: m.ExpiraEm, AssinadoEm: m.AssinadoEm,
	}
	if m.TokenAcesso != nil {
		rec.TokenAcesso = *m.TokenAcesso
	}
	return rec
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
