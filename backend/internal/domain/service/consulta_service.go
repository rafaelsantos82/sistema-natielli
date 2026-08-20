package service

import (
	"context"
	"log/slog"
	"strings"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type ConsultaService struct {
	repo     repository.ConsultaRepository
	salaRepo repository.SalaRepository
	profRepo repository.ProfissionalRepository
	carteira *PacienteProfissionalService
	logger   *slog.Logger
}

func NewConsultaService(
	repo repository.ConsultaRepository,
	salaRepo repository.SalaRepository,
	carteira *PacienteProfissionalService,
	logger *slog.Logger,
) *ConsultaService {
	return &ConsultaService{repo: repo, salaRepo: salaRepo, carteira: carteira, logger: logger}
}

// NewConsultaServiceWithProfissional habilita validação de agenda do profissional (dias, horário, sobreposição).
func NewConsultaServiceWithProfissional(
	repo repository.ConsultaRepository,
	salaRepo repository.SalaRepository,
	profRepo repository.ProfissionalRepository,
	carteira *PacienteProfissionalService,
	logger *slog.Logger,
) *ConsultaService {
	return &ConsultaService{
		repo:     repo,
		salaRepo: salaRepo,
		profRepo: profRepo,
		carteira: carteira,
		logger:   logger,
	}
}

type ConsultaInput struct {
	PacienteID          uuid.UUID
	ProfissionalID      uuid.UUID
	UnidadeID           *uuid.UUID
	SalaID              uuid.UUID
	DataHora            time.Time
	Duracao             int
	Motivo              string
	Observacoes         *string
	ObservacoesAnamnese *string
}

type ListConsultasResult struct {
	Items      []*ConsultaDTO
	Total      int64
	Page       int
	PageSize   int
	TotalPages int
}

// Create agenda uma nova consulta.
func (s *ConsultaService) Create(ctx context.Context, in ConsultaInput) (*ConsultaDTO, error) {
	c, err := s.buildConsulta(ctx, uuid.New(), in, true)
	if err != nil {
		return nil, err
	}
	if err := s.repo.Save(ctx, c); err != nil {
		return nil, err
	}
	if err := s.syncReservaFromConsulta(ctx, c, ""); err != nil {
		return nil, err
	}
	s.syncCarteira(ctx, c, true)
	LogMutation(ctx, s.logger, "consulta", "create", c.ID)
	return s.getDTO(ctx, c.ID)
}

// GetByID retorna consulta com nomes de paciente e profissional.
func (s *ConsultaService) GetByID(ctx context.Context, id uuid.UUID) (*ConsultaDTO, error) {
	if id == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("id")
	}
	item, err := s.repo.FindByIDWithNames(ctx, id)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, domainerrors.NewNotFoundError("Consulta", id.String())
	}
	return ToConsultaDTO(*item), nil
}

// Update atualiza dados da consulta.
func (s *ConsultaService) Update(ctx context.Context, id uuid.UUID, in ConsultaInput) (*ConsultaDTO, error) {
	if id == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("id")
	}
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, domainerrors.NewNotFoundError("Consulta", id.String())
	}
	if existing.Status == entity.ConsultaCancelada || existing.Status == entity.ConsultaConcluida {
		return nil, domainerrors.NewBusinessRuleError("Consulta cancelada ou concluída não pode ser editada")
	}
	c, err := s.buildConsulta(ctx, id, in, false)
	if err != nil {
		return nil, err
	}
	c.Status = existing.Status
	c.NotificacaoEnviada = existing.NotificacaoEnviada
	c.ConfirmacaoPresenca = existing.ConfirmacaoPresenca
	c.CreatedAt = existing.CreatedAt
	if err := s.repo.Update(ctx, c); err != nil {
		return nil, err
	}
	item, _ := s.repo.FindByIDWithNames(ctx, c.ID)
	profNome := ""
	if item != nil {
		profNome = item.ProfissionalNome
	}
	if err := s.syncReservaFromConsulta(ctx, c, profNome); err != nil {
		return nil, err
	}
	s.syncCarteira(ctx, c, c.Status == entity.ConsultaConcluida)
	LogMutation(ctx, s.logger, "consulta", "update", c.ID)
	return s.getDTO(ctx, c.ID)
}

// Delete remove consulta.
func (s *ConsultaService) Delete(ctx context.Context, id uuid.UUID) error {
	if id == uuid.Nil {
		return domainerrors.NewRequiredFieldError("id")
	}
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return domainerrors.NewNotFoundError("Consulta", id.String())
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "consulta", "delete", id)
	return nil
}

// List retorna consultas paginadas com filtros.
func (s *ConsultaService) List(ctx context.Context, filter repository.ConsultaListFilter) (*ListConsultasResult, error) {
	filter.Page, filter.PageSize = NormalizePagination(filter.Page, filter.PageSize)
	items, total, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, err
	}
	dtos := make([]*ConsultaDTO, 0, len(items))
	for _, item := range items {
		dto := ToConsultaDTO(item)
		dtos = append(dtos, dto)
	}
	return &ListConsultasResult{
		Items:      dtos,
		Total:      total,
		Page:       filter.Page,
		PageSize:   filter.PageSize,
		TotalPages: TotalPages(total, filter.PageSize),
	}, nil
}

// Confirmar confirma presença da consulta agendada.
func (s *ConsultaService) Confirmar(ctx context.Context, id uuid.UUID) (*ConsultaDTO, error) {
	return s.transitionStatus(ctx, id, "confirmar", func(c *entity.Consulta) error {
		if !c.CanConfirmar() {
			return domainerrors.NewBusinessRuleError("Apenas consultas agendadas podem ser confirmadas")
		}
		c.Status = entity.ConsultaConfirmada
		c.ConfirmacaoPresenca = true
		return nil
	})
}

// Cancelar cancela consulta agendada ou confirmada.
func (s *ConsultaService) Cancelar(ctx context.Context, id uuid.UUID) (*ConsultaDTO, error) {
	return s.transitionStatus(ctx, id, "cancelar", func(c *entity.Consulta) error {
		if !c.CanCancelar() {
			return domainerrors.NewBusinessRuleError("Consulta não pode ser cancelada neste status")
		}
		c.Status = entity.ConsultaCancelada
		return nil
	})
}

// Concluir marca consulta como concluída.
func (s *ConsultaService) Concluir(ctx context.Context, id uuid.UUID) (*ConsultaDTO, error) {
	_, err := s.transitionStatus(ctx, id, "concluir", func(c *entity.Consulta) error {
		if !c.CanConcluir() {
			return domainerrors.NewBusinessRuleError("Consulta não pode ser concluída neste status")
		}
		c.Status = entity.ConsultaConcluida
		return nil
	})
	if err != nil {
		return nil, err
	}
	aguardando := entity.AguardandoProntuario
	if err := s.repo.PatchAtendimento(ctx, id, map[string]interface{}{
		"status_atendimento": string(aguardando),
	}); err != nil {
		return nil, err
	}
	return s.getDTO(ctx, id)
}

// VincularProntuario associa evolução e avança workflow.
func (s *ConsultaService) VincularProntuario(ctx context.Context, id, evolucaoID uuid.UUID) (*ConsultaDTO, error) {
	c, err := s.repo.FindByID(ctx, id)
	if err != nil || c == nil {
		return nil, domainerrors.NewNotFoundError("Consulta", id.String())
	}
	pronto := entity.ProntoParaAprovacao
	patch := map[string]interface{}{
		"prontuario_evolucao_id": evolucaoID,
		"status_atendimento":     string(pronto),
	}
	if c.StatusAtendimento != nil &&
		(*c.StatusAtendimento == entity.AtendimentoAprovado || *c.StatusAtendimento == entity.AtendimentoRejeitado) {
		delete(patch, "status_atendimento")
	}
	if err := s.repo.PatchAtendimento(ctx, id, patch); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "consulta", "vincular_prontuario", id)
	return s.getDTO(ctx, id)
}

// AprovarAtendimento aprova atendimento com prontuário vinculado.
func (s *ConsultaService) AprovarAtendimento(ctx context.Context, id, actorID uuid.UUID) (*ConsultaDTO, error) {
	c, err := s.repo.FindByID(ctx, id)
	if err != nil || c == nil {
		return nil, domainerrors.NewNotFoundError("Consulta", id.String())
	}
	if c.ProntuarioEvolucaoID == nil {
		return nil, domainerrors.NewBusinessRuleError("Atendimento sem prontuário vinculado não pode ser aprovado")
	}
	now := time.Now().UTC()
	aprovado := entity.AtendimentoAprovado
	patch := map[string]interface{}{
		"status_atendimento": string(aprovado),
		"aprovado_em":        now,
		"motivo_rejeicao":    nil,
		"rejeitado_por":      nil,
		"rejeitado_em":       nil,
	}
	if actorID != uuid.Nil {
		patch["aprovado_por"] = actorID
	}
	if err := s.repo.PatchAtendimento(ctx, id, patch); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "consulta", "aprovar_atendimento", id)
	return s.getDTO(ctx, id)
}

// RejeitarAtendimento rejeita atendimento informando motivo.
func (s *ConsultaService) RejeitarAtendimento(ctx context.Context, id uuid.UUID, motivo string, actorID uuid.UUID) (*ConsultaDTO, error) {
	if strings.TrimSpace(motivo) == "" {
		return nil, domainerrors.NewRequiredFieldError("motivo")
	}
	c, err := s.repo.FindByID(ctx, id)
	if err != nil || c == nil {
		return nil, domainerrors.NewNotFoundError("Consulta", id.String())
	}
	now := time.Now().UTC()
	rejeitado := entity.AtendimentoRejeitado
	patch := map[string]interface{}{
		"status_atendimento": string(rejeitado),
		"rejeitado_em":       now,
		"motivo_rejeicao":    strings.TrimSpace(motivo),
	}
	if actorID != uuid.Nil {
		patch["rejeitado_por"] = actorID
	}
	if err := s.repo.PatchAtendimento(ctx, id, patch); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "consulta", "rejeitar_atendimento", id)
	return s.getDTO(ctx, id)
}

func (s *ConsultaService) transitionStatus(ctx context.Context, id uuid.UUID, action string, fn func(*entity.Consulta) error) (*ConsultaDTO, error) {
	c, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if c == nil {
		return nil, domainerrors.NewNotFoundError("Consulta", id.String())
	}
	if err := fn(c); err != nil {
		return nil, err
	}
	c.UpdatedAt = time.Now().UTC()
	if err := s.repo.Update(ctx, c); err != nil {
		return nil, err
	}
	if action == "cancelar" {
		s.deleteReservaLinked(ctx, c.ID)
	}
	LogMutation(ctx, s.logger, "consulta", action, id)
	if action == "concluir" {
		c, findErr := s.repo.FindByID(ctx, id)
		if findErr == nil && c != nil {
			s.syncCarteira(ctx, c, true)
		}
	}
	return s.getDTO(ctx, id)
}

func (s *ConsultaService) syncCarteira(ctx context.Context, c *entity.Consulta, realizada bool) {
	if s.carteira == nil || c == nil {
		return
	}
	var err error
	if realizada || c.Status == entity.ConsultaConcluida {
		err = s.carteira.LinkRealizada(ctx, c)
	} else {
		err = s.carteira.LinkAgendada(ctx, c)
	}
	if err != nil {
		LogMutation(ctx, s.logger, "paciente_profissional", "sync_error", c.ID)
	}
}

func (s *ConsultaService) buildConsulta(ctx context.Context, id uuid.UUID, in ConsultaInput, isNew bool) (*entity.Consulta, error) {
	if in.SalaID == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("sala_id")
	}
	if err := s.validateSalaForConsulta(ctx, in.SalaID, in.UnidadeID); err != nil {
		return nil, err
	}
	salaID := in.SalaID
	now := time.Now().UTC()
	c := &entity.Consulta{
		ID:                  id,
		PacienteID:          in.PacienteID,
		ProfissionalID:      in.ProfissionalID,
		UnidadeID:           in.UnidadeID,
		SalaID:              &salaID,
		DataHora:            in.DataHora,
		Duracao:             in.Duracao,
		Motivo:              strings.TrimSpace(in.Motivo),
		Observacoes:         in.Observacoes,
		ObservacoesAnamnese: in.ObservacoesAnamnese,
		Status:              entity.ConsultaAgendada,
		UpdatedAt:           now,
	}
	if isNew {
		c.CreatedAt = now
	}
	if err := c.Validate(); err != nil {
		return nil, err
	}
	excludeID := uuid.Nil
	if !isNew {
		excludeID = id
	}
	if err := s.validateProfissionalAgenda(ctx, in.ProfissionalID, in.DataHora, in.Duracao, excludeID); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *ConsultaService) validateSalaForConsulta(ctx context.Context, salaID uuid.UUID, unidadeID *uuid.UUID) error {
	if s.salaRepo == nil {
		return domainerrors.NewInternalError("repositório de salas não configurado")
	}
	sala, err := s.salaRepo.FindByID(ctx, salaID)
	if err != nil {
		return err
	}
	if sala == nil {
		return domainerrors.NewInvalidSalaError("Sala inválida ou inativa para esta unidade")
	}
	if sala.Status != entity.SalaAtiva {
		return domainerrors.NewInvalidSalaError("Sala inválida ou inativa para esta unidade")
	}
	if unidadeID != nil && *unidadeID != uuid.Nil && sala.UnidadeID != *unidadeID {
		return domainerrors.NewInvalidSalaError("Sala inválida ou inativa para esta unidade")
	}
	return nil
}

func (s *ConsultaService) syncReservaFromConsulta(ctx context.Context, c *entity.Consulta, profissionalNome string) error {
	if s.salaRepo == nil || c == nil || c.SalaID == nil || *c.SalaID == uuid.Nil {
		return nil
	}
	if c.Status == entity.ConsultaCancelada {
		s.deleteReservaLinked(ctx, c.ID)
		return nil
	}
	if strings.TrimSpace(profissionalNome) == "" {
		item, err := s.repo.FindByIDWithNames(ctx, c.ID)
		if err != nil {
			return err
		}
		if item != nil {
			profissionalNome = item.ProfissionalNome
		}
	}
	if strings.TrimSpace(profissionalNome) == "" {
		profissionalNome = "Profissional"
	}
	motivo := strings.TrimSpace(c.Motivo)
	existing, err := s.salaRepo.FindReservaByConsultaID(ctx, c.ID)
	if err != nil {
		return err
	}
	consultaID := c.ID
	if existing != nil && existing.SalaID != *c.SalaID {
		if delErr := s.salaRepo.DeleteReserva(ctx, existing.SalaID, existing.ID); delErr != nil {
			return delErr
		}
		existing = nil
	}
	if existing == nil {
		res := &entity.Reserva{
			ID:               uuid.New(),
			SalaID:           *c.SalaID,
			DataHoraInicio:   c.DataHora,
			Duracao:          c.Duracao,
			ProfissionalID:   c.ProfissionalID,
			ProfissionalNome: profissionalNome,
			ConsultaID:       &consultaID,
			TipoAtendimento:  &motivo,
			CreatedAt:        time.Now().UTC(),
		}
		if err := res.Validate(); err != nil {
			return err
		}
		return s.salaRepo.SaveReserva(ctx, res)
	}
	existing.SalaID = *c.SalaID
	existing.DataHoraInicio = c.DataHora
	existing.Duracao = c.Duracao
	existing.ProfissionalID = c.ProfissionalID
	existing.ProfissionalNome = profissionalNome
	existing.ConsultaID = &consultaID
	existing.TipoAtendimento = &motivo
	if err := existing.Validate(); err != nil {
		return err
	}
	return s.salaRepo.UpdateReserva(ctx, existing)
}

func (s *ConsultaService) deleteReservaLinked(ctx context.Context, consultaID uuid.UUID) {
	if s.salaRepo == nil {
		return
	}
	existing, err := s.salaRepo.FindReservaByConsultaID(ctx, consultaID)
	if err != nil || existing == nil {
		return
	}
	_ = s.salaRepo.DeleteReserva(ctx, existing.SalaID, existing.ID)
}

func (s *ConsultaService) getDTO(ctx context.Context, id uuid.UUID) (*ConsultaDTO, error) {
	item, err := s.repo.FindByIDWithNames(ctx, id)
	if err == nil && item != nil {
		return ToConsultaDTO(*item), nil
	}
	c, findErr := s.repo.FindByID(ctx, id)
	if findErr != nil {
		if err != nil {
			return nil, err
		}
		return nil, findErr
	}
	if c == nil {
		return nil, domainerrors.NewNotFoundError("Consulta", id.String())
	}
	return ToConsultaDTO(repository.ConsultaListItem{Consulta: c}), nil
}
