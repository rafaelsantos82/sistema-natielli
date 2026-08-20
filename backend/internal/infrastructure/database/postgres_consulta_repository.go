package database

import (
	"context"
	"errors"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresConsultaRepository struct {
	db *gorm.DB
}

func NewPostgresConsultaRepository(db *gorm.DB) *PostgresConsultaRepository {
	return &PostgresConsultaRepository{db: db}
}

func (r *PostgresConsultaRepository) Save(ctx context.Context, c *entity.Consulta) error {
	model := consultaEntityToModel(c)
	if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
		return mapConsultaDBError(err)
	}
	return nil
}

func (r *PostgresConsultaRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.Consulta, error) {
	var model consultaModel
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapConsultaDBError(err)
	}
	return consultaModelToEntity(&model), nil
}

func (r *PostgresConsultaRepository) FindByIDWithNames(ctx context.Context, id uuid.UUID) (*repository.ConsultaListItem, error) {
	row, err := r.fetchOneWithNames(ctx, "consultas.id = ?", id)
	if err != nil {
		return nil, err
	}
	return row, nil
}

func (r *PostgresConsultaRepository) Update(ctx context.Context, c *entity.Consulta) error {
	model := consultaEntityToModel(c)
	if err := r.db.WithContext(ctx).Model(&consultaModel{}).Where("id = ?", c.ID).Updates(&model).Error; err != nil {
		return mapConsultaDBError(err)
	}
	return nil
}

func (r *PostgresConsultaRepository) Delete(ctx context.Context, id uuid.UUID) error {
	err := r.db.WithContext(ctx).Where("id = ?", id).Delete(&consultaModel{}).Error
	return mapConsultaDBError(err)
}

const consultaListSelect = `consultas.id, consultas.paciente_id, consultas.profissional_id, consultas.unidade_id,
consultas.sala_id, consultas.data_hora, consultas.duracao, consultas.motivo, consultas.observacoes, consultas.observacoes_anamnese,
consultas.status, consultas.notificacao_enviada, consultas.confirmacao_presenca, consultas.status_atendimento,
consultas.prontuario_evolucao_id, consultas.aprovado_por, consultas.aprovado_em, consultas.rejeitado_por,
consultas.rejeitado_em, consultas.motivo_rejeicao, consultas.created_at, consultas.updated_at,
pacientes.nome_completo AS paciente_nome, profissionais.nome AS profissional_nome,
COALESCE(salas.nome_sala, '') AS sala_nome`

func (r *PostgresConsultaRepository) List(ctx context.Context, filter repository.ConsultaListFilter) ([]repository.ConsultaListItem, int64, error) {
	q := r.db.WithContext(ctx).Table("consultas").
		Select(consultaListSelect).
		Joins("JOIN pacientes ON pacientes.id = consultas.paciente_id").
		Joins("JOIN profissionais ON profissionais.id = consultas.profissional_id").
		Joins("LEFT JOIN salas ON salas.id = consultas.sala_id")

	if filter.UnidadeID != nil {
		q = q.Where("consultas.unidade_id = ?", *filter.UnidadeID)
	}
	if filter.ProfissionalID != nil {
		q = q.Where("consultas.profissional_id = ?", *filter.ProfissionalID)
	}
	if filter.PacienteID != nil {
		q = q.Where("consultas.paciente_id = ?", *filter.PacienteID)
	}
	if filter.DataInicio != nil {
		q = q.Where("consultas.data_hora >= ?", *filter.DataInicio)
	}
	if filter.DataFim != nil {
		q = q.Where("consultas.data_hora <= ?", *filter.DataFim)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, mapConsultaDBError(err)
	}

	offset := (filter.Page - 1) * filter.PageSize
	var rows []consultaListRow
	err := q.Order("consultas.data_hora ASC").Offset(offset).Limit(filter.PageSize).Scan(&rows).Error
	if err != nil {
		return nil, 0, mapConsultaDBError(err)
	}

	out := make([]repository.ConsultaListItem, 0, len(rows))
	for i := range rows {
		out = append(out, rows[i].toListItem())
	}
	return out, total, nil
}

func (r *PostgresConsultaRepository) fetchOneWithNames(ctx context.Context, where string, arg any) (*repository.ConsultaListItem, error) {
	var row consultaListRow
	err := r.db.WithContext(ctx).Table("consultas").
		Select(consultaListSelect).
		Joins("JOIN pacientes ON pacientes.id = consultas.paciente_id").
		Joins("JOIN profissionais ON profissionais.id = consultas.profissional_id").
		Joins("LEFT JOIN salas ON salas.id = consultas.sala_id").
		Where(where, arg).
		First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapConsultaDBError(err)
	}
	item := row.toListItem()
	return &item, nil
}

// consultaListRow mapeia colunas explícitas do SELECT — embed de consultaModel não popula no Scan.
type consultaListRow struct {
	ID                   uuid.UUID  `gorm:"column:id"`
	PacienteID           uuid.UUID  `gorm:"column:paciente_id"`
	ProfissionalID       uuid.UUID  `gorm:"column:profissional_id"`
	UnidadeID            *uuid.UUID `gorm:"column:unidade_id"`
	SalaID               *uuid.UUID `gorm:"column:sala_id"`
	DataHora             time.Time  `gorm:"column:data_hora"`
	Duracao              int        `gorm:"column:duracao"`
	Motivo               string     `gorm:"column:motivo"`
	Observacoes          *string    `gorm:"column:observacoes"`
	ObservacoesAnamnese  *string    `gorm:"column:observacoes_anamnese"`
	Status               string     `gorm:"column:status"`
	NotificacaoEnviada   bool       `gorm:"column:notificacao_enviada"`
	ConfirmacaoPresenca  bool       `gorm:"column:confirmacao_presenca"`
	StatusAtendimento    *string    `gorm:"column:status_atendimento"`
	ProntuarioEvolucaoID *uuid.UUID `gorm:"column:prontuario_evolucao_id"`
	AprovadoPor          *uuid.UUID `gorm:"column:aprovado_por"`
	AprovadoEm           *time.Time `gorm:"column:aprovado_em"`
	RejeitadoPor         *uuid.UUID `gorm:"column:rejeitado_por"`
	RejeitadoEm          *time.Time `gorm:"column:rejeitado_em"`
	MotivoRejeicao       *string    `gorm:"column:motivo_rejeicao"`
	CreatedAt            time.Time  `gorm:"column:created_at"`
	UpdatedAt            time.Time  `gorm:"column:updated_at"`
	PacienteNome         string     `gorm:"column:paciente_nome"`
	ProfissionalNome     string     `gorm:"column:profissional_nome"`
	SalaNome             string     `gorm:"column:sala_nome"`
}

func (row *consultaListRow) toListItem() repository.ConsultaListItem {
	m := &consultaModel{
		ID:                   row.ID,
		PacienteID:           row.PacienteID,
		ProfissionalID:       row.ProfissionalID,
		UnidadeID:            row.UnidadeID,
		SalaID:               row.SalaID,
		DataHora:             row.DataHora,
		Duracao:              row.Duracao,
		Motivo:               row.Motivo,
		Observacoes:          row.Observacoes,
		ObservacoesAnamnese:  row.ObservacoesAnamnese,
		Status:               row.Status,
		NotificacaoEnviada:   row.NotificacaoEnviada,
		ConfirmacaoPresenca:  row.ConfirmacaoPresenca,
		StatusAtendimento:    row.StatusAtendimento,
		ProntuarioEvolucaoID: row.ProntuarioEvolucaoID,
		AprovadoPor:          row.AprovadoPor,
		AprovadoEm:           row.AprovadoEm,
		RejeitadoPor:         row.RejeitadoPor,
		RejeitadoEm:          row.RejeitadoEm,
		MotivoRejeicao:       row.MotivoRejeicao,
		CreatedAt:            row.CreatedAt,
		UpdatedAt:            row.UpdatedAt,
	}
	return repository.ConsultaListItem{
		Consulta:         consultaModelToEntity(m),
		PacienteNome:     row.PacienteNome,
		ProfissionalNome: row.ProfissionalNome,
		SalaNome:         row.SalaNome,
	}
}

func consultaEntityToModel(c *entity.Consulta) *consultaModel {
	var statusAtend *string
	if c.StatusAtendimento != nil {
		s := string(*c.StatusAtendimento)
		statusAtend = &s
	}
	return &consultaModel{
		ID:                   c.ID,
		PacienteID:           c.PacienteID,
		ProfissionalID:       c.ProfissionalID,
		UnidadeID:            c.UnidadeID,
		SalaID:               c.SalaID,
		DataHora:             c.DataHora,
		Duracao:              c.Duracao,
		Motivo:               c.Motivo,
		Observacoes:          c.Observacoes,
		ObservacoesAnamnese:  c.ObservacoesAnamnese,
		Status:               string(c.Status),
		NotificacaoEnviada:   c.NotificacaoEnviada,
		ConfirmacaoPresenca:  c.ConfirmacaoPresenca,
		StatusAtendimento:    statusAtend,
		ProntuarioEvolucaoID: c.ProntuarioEvolucaoID,
		AprovadoPor:          c.AprovadoPor,
		AprovadoEm:           c.AprovadoEm,
		RejeitadoPor:         c.RejeitadoPor,
		RejeitadoEm:          c.RejeitadoEm,
		MotivoRejeicao:       c.MotivoRejeicao,
		CreatedAt:            c.CreatedAt,
		UpdatedAt:            c.UpdatedAt,
	}
}

func consultaModelToEntity(m *consultaModel) *entity.Consulta {
	var statusAtend *entity.StatusAtendimento
	if m.StatusAtendimento != nil && *m.StatusAtendimento != "" {
		s := entity.StatusAtendimento(*m.StatusAtendimento)
		statusAtend = &s
	}
	return &entity.Consulta{
		ID:                   m.ID,
		PacienteID:           m.PacienteID,
		ProfissionalID:       m.ProfissionalID,
		UnidadeID:            m.UnidadeID,
		SalaID:               m.SalaID,
		DataHora:             m.DataHora,
		Duracao:              m.Duracao,
		Motivo:               m.Motivo,
		Observacoes:          m.Observacoes,
		ObservacoesAnamnese:  m.ObservacoesAnamnese,
		Status:               entity.ConsultaStatus(m.Status),
		NotificacaoEnviada:   m.NotificacaoEnviada,
		ConfirmacaoPresenca:  m.ConfirmacaoPresenca,
		StatusAtendimento:    statusAtend,
		ProntuarioEvolucaoID: m.ProntuarioEvolucaoID,
		AprovadoPor:          m.AprovadoPor,
		AprovadoEm:           m.AprovadoEm,
		RejeitadoPor:         m.RejeitadoPor,
		RejeitadoEm:          m.RejeitadoEm,
		MotivoRejeicao:       m.MotivoRejeicao,
		CreatedAt:            m.CreatedAt,
		UpdatedAt:            m.UpdatedAt,
	}
}

func (r *PostgresConsultaRepository) ExistsBySalaID(ctx context.Context, salaID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.WithContext(ctx).Raw(
		`SELECT EXISTS (SELECT 1 FROM consultas WHERE sala_id = ? LIMIT 1)`,
		salaID,
	).Scan(&exists).Error
	if err != nil {
		return false, mapConsultaDBError(err)
	}
	return exists, nil
}

// PatchAtendimento atualiza apenas campos de workflow de atendimento/prontuário.
func (r *PostgresConsultaRepository) PatchAtendimento(ctx context.Context, id uuid.UUID, patch map[string]interface{}) error {
	patch["updated_at"] = time.Now().UTC()
	err := r.db.WithContext(ctx).Model(&consultaModel{}).Where("id = ?", id).Updates(patch).Error
	return mapConsultaDBError(err)
}

func mapConsultaDBError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return domainerrors.NewNotFoundError("Consulta", "")
	}
	return MapDBError(err)
}
