package database

import (
	"context"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresProntuarioRepository struct {
	db *gorm.DB
}

func NewPostgresProntuarioRepository(db *gorm.DB) *PostgresProntuarioRepository {
	return &PostgresProntuarioRepository{db: db}
}

func (r *PostgresProntuarioRepository) ListEvolucoes(ctx context.Context, pacienteID uuid.UUID) ([]service.EvolucaoDTO, error) {
	var rows []evolucaoModel
	if err := r.db.WithContext(ctx).Where("paciente_id = ?", pacienteID).Order("data DESC").Find(&rows).Error; err != nil {
		return nil, MapDBError(err)
	}
	out := make([]service.EvolucaoDTO, 0, len(rows))
	for _, m := range rows {
		out = append(out, evolucaoToDTO(&m))
	}
	return out, nil
}

func (r *PostgresProntuarioRepository) CreateEvolucao(ctx context.Context, in service.EvolucaoInput) (*service.EvolucaoDTO, error) {
	m := &evolucaoModel{
		ID:                  uuid.New(),
		ConsultaID:          in.ConsultaID,
		PacienteID:          in.PacienteID,
		Data:                time.Now().UTC(),
		QueixaPrincipal:     in.QueixaPrincipal,
		HistoriaDoenca:      in.HistoriaDoenca,
		ExameFisico:         in.ExameFisico,
		HipoteseDiagnostica: in.HipoteseDiagnostica,
		Conduta:             in.Conduta,
		Observacoes:         in.Observacoes,
	}
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return nil, MapDBError(err)
	}
	dto := evolucaoToDTO(m)
	return &dto, nil
}

func (r *PostgresProntuarioRepository) DeleteEvolucao(ctx context.Context, id uuid.UUID) error {
	err := r.db.WithContext(ctx).Where("id = ?", id).Delete(&evolucaoModel{}).Error
	return MapDBError(err)
}

func (r *PostgresProntuarioRepository) ListPrescricoes(ctx context.Context, pacienteID uuid.UUID) ([]service.PrescricaoDTO, error) {
	var rows []prescricaoModel
	if err := r.db.WithContext(ctx).Where("paciente_id = ?", pacienteID).Order("data DESC").Find(&rows).Error; err != nil {
		return nil, MapDBError(err)
	}
	out := make([]service.PrescricaoDTO, 0, len(rows))
	for _, m := range rows {
		out = append(out, prescricaoToDTO(&m))
	}
	return out, nil
}

func (r *PostgresProntuarioRepository) CreatePrescricao(ctx context.Context, in service.PrescricaoInput) (*service.PrescricaoDTO, error) {
	m := &prescricaoModel{
		ID:          uuid.New(),
		ConsultaID:  in.ConsultaID,
		PacienteID:  in.PacienteID,
		Data:        time.Now().UTC(),
		Medicamento: in.Medicamento,
		Dosagem:     in.Dosagem,
		Frequencia:  in.Frequencia,
		Duracao:     in.Duracao,
		Orientacoes: in.Orientacoes,
	}
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return nil, MapDBError(err)
	}
	dto := prescricaoToDTO(m)
	return &dto, nil
}

func (r *PostgresProntuarioRepository) DeletePrescricao(ctx context.Context, id uuid.UUID) error {
	return MapDBError(r.db.WithContext(ctx).Where("id = ?", id).Delete(&prescricaoModel{}).Error)
}

func (r *PostgresProntuarioRepository) ListAtestados(ctx context.Context, pacienteID uuid.UUID) ([]service.AtestadoDTO, error) {
	var rows []atestadoModel
	if err := r.db.WithContext(ctx).Where("paciente_id = ?", pacienteID).Order("data DESC").Find(&rows).Error; err != nil {
		return nil, MapDBError(err)
	}
	out := make([]service.AtestadoDTO, 0, len(rows))
	for _, m := range rows {
		out = append(out, atestadoToDTO(&m))
	}
	return out, nil
}

func (r *PostgresProntuarioRepository) CreateAtestado(ctx context.Context, in service.AtestadoInput) (*service.AtestadoDTO, error) {
	inicio, err := time.Parse("2006-01-02", in.DataInicio)
	if err != nil {
		return nil, domainerrors.NewInvalidFormatError("data_inicio", "formato YYYY-MM-DD")
	}
	fim, err := time.Parse("2006-01-02", in.DataFim)
	if err != nil {
		return nil, domainerrors.NewInvalidFormatError("data_fim", "formato YYYY-MM-DD")
	}
	m := &atestadoModel{
		ID:              uuid.New(),
		ConsultaID:      in.ConsultaID,
		PacienteID:      in.PacienteID,
		Data:            time.Now().UTC(),
		CID:             in.CID,
		DiasAfastamento: in.DiasAfastamento,
		DataInicio:      inicio,
		DataFim:         fim,
		Observacoes:     in.Observacoes,
	}
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return nil, MapDBError(err)
	}
	dto := atestadoToDTO(m)
	return &dto, nil
}

func (r *PostgresProntuarioRepository) DeleteAtestado(ctx context.Context, id uuid.UUID) error {
	return MapDBError(r.db.WithContext(ctx).Where("id = ?", id).Delete(&atestadoModel{}).Error)
}

func (r *PostgresProntuarioRepository) ListDocumentos(ctx context.Context, pacienteID uuid.UUID) ([]service.ProntuarioDocumentoDTO, error) {
	var rows []prontuarioDocumentoModel
	if err := r.db.WithContext(ctx).Where("paciente_id = ?", pacienteID).Order("data_upload DESC").Find(&rows).Error; err != nil {
		return nil, MapDBError(err)
	}
	out := make([]service.ProntuarioDocumentoDTO, 0, len(rows))
	for _, m := range rows {
		out = append(out, documentoToDTO(&m))
	}
	return out, nil
}

func (r *PostgresProntuarioRepository) CreateDocumento(ctx context.Context, in service.ProntuarioDocumentoInput) (*service.ProntuarioDocumentoDTO, error) {
	m := &prontuarioDocumentoModel{
		ID:         uuid.New(),
		ConsultaID: in.ConsultaID,
		PacienteID: in.PacienteID,
		Nome:       in.Nome,
		Tipo:       in.Tipo,
		Tamanho:    in.Tamanho,
		DataUpload: time.Now().UTC(),
		URL:        in.URL,
	}
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return nil, MapDBError(err)
	}
	dto := documentoToDTO(m)
	return &dto, nil
}

func (r *PostgresProntuarioRepository) DeleteDocumento(ctx context.Context, id uuid.UUID) error {
	return MapDBError(r.db.WithContext(ctx).Where("id = ?", id).Delete(&prontuarioDocumentoModel{}).Error)
}

func (r *PostgresProntuarioRepository) GetPacienteProntuario(ctx context.Context, pacienteID uuid.UUID) (*service.ProntuarioPacienteDTO, error) {
	ev, err := r.ListEvolucoes(ctx, pacienteID)
	if err != nil {
		return nil, err
	}
	pr, err := r.ListPrescricoes(ctx, pacienteID)
	if err != nil {
		return nil, err
	}
	at, err := r.ListAtestados(ctx, pacienteID)
	if err != nil {
		return nil, err
	}
	doc, err := r.ListDocumentos(ctx, pacienteID)
	if err != nil {
		return nil, err
	}
	return &service.ProntuarioPacienteDTO{
		PacienteID:  pacienteID,
		Evolucoes:   ev,
		Prescricoes: pr,
		Atestados:   at,
		Documentos:  doc,
	}, nil
}

func evolucaoToDTO(m *evolucaoModel) service.EvolucaoDTO {
	return service.EvolucaoDTO{
		ID: m.ID, ConsultaID: m.ConsultaID, PacienteID: m.PacienteID, Data: m.Data,
		QueixaPrincipal: m.QueixaPrincipal, HistoriaDoenca: m.HistoriaDoenca,
		ExameFisico: m.ExameFisico, HipoteseDiagnostica: m.HipoteseDiagnostica,
		Conduta: m.Conduta, Observacoes: m.Observacoes, CreatedAt: m.CreatedAt,
	}
}

func prescricaoToDTO(m *prescricaoModel) service.PrescricaoDTO {
	return service.PrescricaoDTO{
		ID: m.ID, ConsultaID: m.ConsultaID, PacienteID: m.PacienteID, Data: m.Data,
		Medicamento: m.Medicamento, Dosagem: m.Dosagem, Frequencia: m.Frequencia,
		Duracao: m.Duracao, Orientacoes: m.Orientacoes, CreatedAt: m.CreatedAt,
	}
}

func atestadoToDTO(m *atestadoModel) service.AtestadoDTO {
	return service.AtestadoDTO{
		ID: m.ID, ConsultaID: m.ConsultaID, PacienteID: m.PacienteID, Data: m.Data,
		CID: m.CID, DiasAfastamento: m.DiasAfastamento,
		DataInicio: m.DataInicio.Format("2006-01-02"), DataFim: m.DataFim.Format("2006-01-02"),
		Observacoes: m.Observacoes, CreatedAt: m.CreatedAt,
	}
}

func documentoToDTO(m *prontuarioDocumentoModel) service.ProntuarioDocumentoDTO {
	return service.ProntuarioDocumentoDTO{
		ID: m.ID, ConsultaID: m.ConsultaID, PacienteID: m.PacienteID,
		Nome: m.Nome, Tipo: m.Tipo, Tamanho: m.Tamanho, DataUpload: m.DataUpload,
		URL: m.URL, CreatedAt: m.CreatedAt,
	}
}
