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

type ProfissionalService struct {
	repo   repository.ProfissionalRepository
	logger *slog.Logger
}

func NewProfissionalService(repo repository.ProfissionalRepository, logger *slog.Logger) *ProfissionalService {
	return &ProfissionalService{repo: repo, logger: logger}
}

type ProfissionalInput struct {
	Nome                   string
	CPF                    *string
	RG                     *string
	DataNascimento         *time.Time
	Email                  string
	Telefone               *string
	Celular                *string
	Conselho               *string
	NumeroRegistro         *string
	UFRegistro             *string
	Foto                   *string
	CEP                    *string
	Logradouro             *string
	Numero                 *string
	Complemento            *string
	Bairro                 *string
	Cidade                 *string
	UF                     *string
	ModalidadesAtendimento []string
	LocaisAtendimento      []string
	DuracaoPadraoSessao    *int
	DiasAtendimento        []string
	JanelasHorarias        []map[string]interface{}
	HorarioInicio          *string
	HorarioFim             *string
	DuracaoConsulta        *int
	ConsentimentoLGPD      bool
	DataConsentimento      *time.Time
	CompartilhamentoDados  bool
	FinalidadeDados        *string
	Status                 entity.ProfissionalStatus
	Observacoes            *string
	DadosComplementares    map[string]interface{}
	AnexosContratuais      []string
	UnidadeIDs             []uuid.UUID
	Especialidades         []string
}

type ConselhoInput struct {
	Tipo      string
	Numero    string
	UF        string
	Validade  *time.Time
	Principal bool
}

type ListProfissionaisResult struct {
	Items      []*ProfissionalDTO
	Total      int64
	Page       int
	PageSize   int
	TotalPages int
}

// Create cadastra um profissional com unidades e especialidades.
func (s *ProfissionalService) Create(ctx context.Context, in ProfissionalInput) (*ProfissionalDTO, error) {
	p, err := s.buildProfissional(uuid.New(), in, true)
	if err != nil {
		return nil, err
	}
	if err := s.ensureEmailUnique(ctx, p.Email, nil); err != nil {
		return nil, err
	}
	if err := s.repo.Save(ctx, p); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "profissional", "create", p.ID)
	return s.enrichDTO(ctx, p)
}

// GetByID retorna profissional com unidades e especialidades.
func (s *ProfissionalService) GetByID(ctx context.Context, id uuid.UUID) (*ProfissionalDTO, error) {
	if id == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("id")
	}
	p, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, domainerrors.NewNotFoundError("Profissional", id.String())
	}
	return s.enrichDTO(ctx, p)
}

// Update atualiza dados do profissional.
func (s *ProfissionalService) Update(ctx context.Context, id uuid.UUID, in ProfissionalInput) (*ProfissionalDTO, error) {
	if id == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("id")
	}
	existing, err := s.repo.FindByIDUnscoped(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, domainerrors.NewNotFoundError("Profissional", id.String())
	}
	if existing.DeletedAt != nil {
		return nil, domainerrors.NewConflictError("Profissional excluído não pode ser editado. Restaure o cadastro antes.")
	}
	p, err := s.buildProfissional(id, in, false)
	if err != nil {
		return nil, err
	}
	p.CreatedAt = existing.CreatedAt
	if err := s.ensureEmailUnique(ctx, p.Email, &id); err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, p); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "profissional", "update", p.ID)
	return s.enrichDTO(ctx, p)
}

// Delete exclui profissional (soft delete).
func (s *ProfissionalService) Delete(ctx context.Context, id uuid.UUID) error {
	if id == uuid.Nil {
		return domainerrors.NewRequiredFieldError("id")
	}
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return domainerrors.NewNotFoundError("Profissional", id.String())
	}
	if err := s.repo.MarkDeleted(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "profissional", "delete", id)
	return nil
}

// Restore reativa profissional excluído (soft delete).
func (s *ProfissionalService) Restore(ctx context.Context, id uuid.UUID) (*ProfissionalDTO, error) {
	if id == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("id")
	}
	existing, err := s.repo.FindByIDUnscoped(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, domainerrors.NewNotFoundError("Profissional", id.String())
	}
	if existing.DeletedAt == nil {
		return nil, domainerrors.NewConflictError("Profissional já está ativo")
	}
	if err := s.repo.Restore(ctx, id); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "profissional", "restore", id)
	return s.GetByID(ctx, id)
}

// List retorna profissionais paginados.
func (s *ProfissionalService) List(ctx context.Context, filter repository.ProfissionalListFilter) (*ListProfissionaisResult, error) {
	filter.Page, filter.PageSize = NormalizePagination(filter.Page, filter.PageSize)

	items, total, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, err
	}

	dtos := make([]*ProfissionalDTO, 0, len(items))
	for _, p := range items {
		dto, err := s.enrichDTO(ctx, p)
		if err != nil {
			return nil, err
		}
		dtos = append(dtos, dto)
	}

	return &ListProfissionaisResult{
		Items:      dtos,
		Total:      total,
		Page:       filter.Page,
		PageSize:   filter.PageSize,
		TotalPages: TotalPages(total, filter.PageSize),
	}, nil
}

// ListConselhos lista conselhos do profissional.
func (s *ProfissionalService) ListConselhos(ctx context.Context, profissionalID uuid.UUID) ([]*ProfissionalConselhoDTO, error) {
	if err := s.ensureProfissionalExists(ctx, profissionalID); err != nil {
		return nil, err
	}
	items, err := s.repo.ListConselhos(ctx, profissionalID)
	if err != nil {
		return nil, err
	}
	dtos := make([]*ProfissionalConselhoDTO, 0, len(items))
	for _, c := range items {
		dtos = append(dtos, ToProfissionalConselhoDTO(c))
	}
	return dtos, nil
}

// CreateConselho adiciona conselho ao profissional.
func (s *ProfissionalService) CreateConselho(ctx context.Context, profissionalID uuid.UUID, in ConselhoInput) (*ProfissionalConselhoDTO, error) {
	if err := s.ensureProfissionalExists(ctx, profissionalID); err != nil {
		return nil, err
	}
	c, err := s.buildConselho(uuid.New(), profissionalID, in, true)
	if err != nil {
		return nil, err
	}
	if err := s.repo.SaveConselho(ctx, c); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "profissional_conselho", "create", c.ID)
	return ToProfissionalConselhoDTO(c), nil
}

// UpdateConselho atualiza conselho do profissional.
func (s *ProfissionalService) UpdateConselho(ctx context.Context, profissionalID, conselhoID uuid.UUID, in ConselhoInput) (*ProfissionalConselhoDTO, error) {
	if err := s.ensureProfissionalExists(ctx, profissionalID); err != nil {
		return nil, err
	}
	existing, err := s.repo.FindConselhoByID(ctx, profissionalID, conselhoID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, domainerrors.NewNotFoundError("Conselho", conselhoID.String())
	}
	c, err := s.buildConselho(conselhoID, profissionalID, in, false)
	if err != nil {
		return nil, err
	}
	c.CreatedAt = existing.CreatedAt
	if err := s.repo.UpdateConselho(ctx, c); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "profissional_conselho", "update", c.ID)
	return ToProfissionalConselhoDTO(c), nil
}

// DeleteConselho remove conselho do profissional.
func (s *ProfissionalService) DeleteConselho(ctx context.Context, profissionalID, conselhoID uuid.UUID) error {
	if err := s.ensureProfissionalExists(ctx, profissionalID); err != nil {
		return err
	}
	existing, err := s.repo.FindConselhoByID(ctx, profissionalID, conselhoID)
	if err != nil {
		return err
	}
	if existing == nil {
		return domainerrors.NewNotFoundError("Conselho", conselhoID.String())
	}
	if err := s.repo.SoftDeleteConselho(ctx, profissionalID, conselhoID); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "profissional_conselho", "delete", conselhoID)
	return nil
}

func (s *ProfissionalService) enrichDTO(ctx context.Context, p *entity.Profissional) (*ProfissionalDTO, error) {
	unidades, err := s.repo.GetUnidadeIDs(ctx, p.ID)
	if err != nil {
		return nil, err
	}
	p.UnidadeIDs = unidades
	especialidades, err := s.repo.GetEspecialidades(ctx, p.ID)
	if err != nil {
		return nil, err
	}
	p.Especialidades = especialidades
	return ToProfissionalDTO(p), nil
}

func (s *ProfissionalService) buildProfissional(id uuid.UUID, in ProfissionalInput, isNew bool) (*entity.Profissional, error) {
	status := in.Status
	if status == "" {
		status = entity.ProfissionalAtivo
	}
	now := time.Now().UTC()
	var conselho *entity.ConselhoTipo
	if in.Conselho != nil && *in.Conselho != "" {
		ct := entity.ConselhoTipo(*in.Conselho)
		conselho = &ct
	}
	p := &entity.Profissional{
		ID:                     id,
		Nome:                   strings.TrimSpace(in.Nome),
		CPF:                    in.CPF,
		RG:                     in.RG,
		DataNascimento:         in.DataNascimento,
		Email:                  strings.TrimSpace(strings.ToLower(in.Email)),
		Telefone:               in.Telefone,
		Celular:                in.Celular,
		Conselho:               conselho,
		NumeroRegistro:         in.NumeroRegistro,
		UFRegistro:             in.UFRegistro,
		Foto:                   in.Foto,
		CEP:                    in.CEP,
		Logradouro:             in.Logradouro,
		Numero:                 in.Numero,
		Complemento:            in.Complemento,
		Bairro:                 in.Bairro,
		Cidade:                 in.Cidade,
		UF:                     in.UF,
		ModalidadesAtendimento: in.ModalidadesAtendimento,
		LocaisAtendimento:      in.LocaisAtendimento,
		DuracaoPadraoSessao:    in.DuracaoPadraoSessao,
		DiasAtendimento:        in.DiasAtendimento,
		JanelasHorarias:        in.JanelasHorarias,
		HorarioInicio:          in.HorarioInicio,
		HorarioFim:             in.HorarioFim,
		DuracaoConsulta:        in.DuracaoConsulta,
		ConsentimentoLGPD:      in.ConsentimentoLGPD,
		DataConsentimento:      in.DataConsentimento,
		CompartilhamentoDados:  in.CompartilhamentoDados,
		FinalidadeDados:        in.FinalidadeDados,
		Status:                 status,
		Observacoes:            in.Observacoes,
		DadosComplementares:    in.DadosComplementares,
		AnexosContratuais:      in.AnexosContratuais,
		UnidadeIDs:             in.UnidadeIDs,
		Especialidades:         in.Especialidades,
		UpdatedAt:              now,
	}
	if isNew {
		p.CreatedAt = now
	}
	if err := p.Validate(); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *ProfissionalService) buildConselho(id, profissionalID uuid.UUID, in ConselhoInput, isNew bool) (*entity.ProfissionalConselho, error) {
	now := time.Now().UTC()
	c := &entity.ProfissionalConselho{
		ID:             id,
		ProfissionalID: profissionalID,
		Tipo:           entity.ConselhoTipo(strings.TrimSpace(in.Tipo)),
		Numero:         strings.TrimSpace(in.Numero),
		UF:             strings.ToUpper(strings.TrimSpace(in.UF)),
		Validade:       in.Validade,
		Principal:      in.Principal,
		UpdatedAt:      now,
	}
	if isNew {
		c.CreatedAt = now
	}
	if err := c.Validate(); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *ProfissionalService) ensureEmailUnique(ctx context.Context, email string, excludeID *uuid.UUID) error {
	exists, err := s.repo.ExistsEmail(ctx, email, excludeID)
	if err != nil {
		return err
	}
	if exists {
		return domainerrors.NewConflictError("E-mail já cadastrado para outro profissional")
	}
	return nil
}

func (s *ProfissionalService) ensureProfissionalExists(ctx context.Context, id uuid.UUID) error {
	p, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if p == nil {
		return domainerrors.NewNotFoundError("Profissional", id.String())
	}
	return nil
}
