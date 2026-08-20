package service

import (
	"context"
	"strings"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type PacienteService struct {
	repo  repository.PacienteRepository
	audit *AuditService
}

func NewPacienteService(repo repository.PacienteRepository, audit *AuditService) *PacienteService {
	return &PacienteService{repo: repo, audit: audit}
}

type UnidadeLinkInput struct {
	UnidadeID uuid.UUID
	Principal bool
}

type PacienteInput struct {
	NomeCompleto            string
	NomeSocial              *string
	DataNascimento          time.Time
	SexoBiologico           entity.SexoBiologico
	CPF                     *string
	RGNumero                *string
	RGOrgao                 *string
	Foto                    *string
	TelPrincipal            string
	TelSecundario           *string
	Email                   *string
	Endereco                *string
	Numero                  *string
	Complemento             *string
	Bairro                  *string
	Cidade                  *string
	UF                      string
	CEP                     string
	ResponsavelNome         string
	ResponsavelCPF          *string
	ResponsavelParentesco   *string
	ResponsavelTel          *string
	ResponsavelEmail        *string
	ContatoEmergenciaNome   *string
	ContatoEmergenciaTel    *string
	PessoasAutorizadasBusca []string
	Escola                  *string
	SerieAno                *string
	NecessidadesEspeciais   *string
	PediatraReferencia      *string
	Altura                  *float64
	Peso                    *float64
	TipoSanguineo           *string
	Alergias                *string
	DoencasCronicas         *string
	MedicacoesContinuo      *string
	CirurgiasPrevias        *string
	HistoricoFamiliar       *string
	Vacinas                 []entity.Vacina
	Observacoes             *string
	AtividadeFisicaFreq     *string
	AtividadeFisicaTipo     *string
	Alimentacao             *string
	SonoHoras               *int
	ProfissionalResponsavel *uuid.UUID
	Status                  entity.PacienteStatus
	ConsentimentoLGPD       bool
	AutorizacaoUsoImagem    bool
	AssinaturaDigital       *string
	DocumentosAnexos        []entity.DocumentoAnexo
	UnidadeLinks            []UnidadeLinkInput
}

type ListPacientesResult struct {
	Items      []*PacienteDTO
	Total      int64
	Page       int
	PageSize   int
	TotalPages int
}

func (s *PacienteService) Create(ctx context.Context, in PacienteInput) (*PacienteDTO, error) {
	p, err := s.buildPaciente(uuid.New(), in, true)
	if err != nil {
		return nil, err
	}
	if err := s.ensureCPFUnique(ctx, p.CPF, nil); err != nil {
		return nil, err
	}
	if err := s.repo.Save(ctx, p); err != nil {
		return nil, err
	}
	return ToPacienteDTO(p), nil
}

func (s *PacienteService) GetByID(ctx context.Context, id uuid.UUID) (*PacienteDTO, error) {
	if id == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("id")
	}
	p, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if p == nil {
		p, err = s.repo.FindByIDUnscoped(ctx, id)
		if err != nil {
			return nil, err
		}
	}
	if p == nil {
		return nil, domainerrors.NewNotFoundError("Paciente", id.String())
	}
	unidades, err := s.repo.GetUnidades(ctx, id)
	if err != nil {
		return nil, err
	}
	p.Unidades = unidades
	return ToPacienteDTO(p), nil
}

func (s *PacienteService) Update(ctx context.Context, id uuid.UUID, in PacienteInput) (*PacienteDTO, error) {
	if id == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("id")
	}
	existing, err := s.repo.FindByIDUnscoped(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, domainerrors.NewNotFoundError("Paciente", id.String())
	}
	if existing.DeletedAt != nil {
		return nil, domainerrors.NewConflictError("Paciente excluído não pode ser editado. Restaure o cadastro antes.")
	}
	p, err := s.buildPaciente(id, in, false)
	if err != nil {
		return nil, err
	}
	p.CreatedAt = existing.CreatedAt
	if err := s.ensureCPFUnique(ctx, p.CPF, &id); err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, p); err != nil {
		return nil, err
	}
	return ToPacienteDTO(p), nil
}

func (s *PacienteService) Delete(ctx context.Context, id uuid.UUID) error {
	if id == uuid.Nil {
		return domainerrors.NewRequiredFieldError("id")
	}
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return domainerrors.NewNotFoundError("Paciente", id.String())
	}
	unidades, err := s.repo.GetUnidades(ctx, id)
	if err != nil {
		return err
	}
	existing.Unidades = unidades
	before := PacienteAuditSnapshotFrom(existing)

	if err := s.repo.MarkDeleted(ctx, id); err != nil {
		return err
	}

	now := time.Now().UTC()
	after := before
	after.Status = string(entity.PacienteInativo)
	after.DeletedAt = ptrTimeRFC3339(now)

	s.recordPacienteAudit(ctx, AuditPacienteExclusao, id.String(), buildPacienteMutationDiff(
		"soft_delete", "DELETE", "/api/v1/pacientes/"+id.String(), before, after,
	))
	return nil
}

func (s *PacienteService) Restore(ctx context.Context, id uuid.UUID) (*PacienteDTO, error) {
	if id == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("id")
	}
	existing, err := s.repo.FindByIDUnscoped(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, domainerrors.NewNotFoundError("Paciente", id.String())
	}
	if existing.DeletedAt == nil {
		return nil, domainerrors.NewConflictError("Paciente já está ativo")
	}
	unidades, err := s.repo.GetUnidades(ctx, id)
	if err != nil {
		return nil, err
	}
	existing.Unidades = unidades
	before := PacienteAuditSnapshotFrom(existing)

	if err := s.repo.Restore(ctx, id); err != nil {
		return nil, err
	}

	after := before
	after.Status = string(entity.PacienteAtivo)
	after.DeletedAt = nil

	s.recordPacienteAudit(ctx, AuditPacienteRestauracao, id.String(), buildPacienteMutationDiff(
		"restore", "POST", "/api/v1/pacientes/"+id.String()+"/restore", before, after,
	))

	return s.GetByID(ctx, id)
}

func (s *PacienteService) List(ctx context.Context, filter repository.PacienteListFilter) (*ListPacientesResult, error) {
	filter.Page, filter.PageSize = NormalizePagination(filter.Page, filter.PageSize)

	items, total, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, err
	}

	dtos := make([]*PacienteDTO, 0, len(items))
	for _, p := range items {
		unidades, uerr := s.repo.GetUnidades(ctx, p.ID)
		if uerr != nil {
			return nil, uerr
		}
		p.Unidades = unidades
		dtos = append(dtos, ToPacienteDTO(p))
	}

	return &ListPacientesResult{
		Items:      dtos,
		Total:      total,
		Page:       filter.Page,
		PageSize:   filter.PageSize,
		TotalPages: TotalPages(total, filter.PageSize),
	}, nil
}

func (s *PacienteService) recordPacienteAudit(ctx context.Context, action, entityID string, diff map[string]interface{}) {
	actorID, actorName, actorRole := pacienteActorFromCtx(ctx)
	RecordPacienteAudit(ctx, s.audit, actorID, actorName, actorRole, action, entityID, diff)
}

func ptrTimeRFC3339(t time.Time) *string {
	s := t.UTC().Format(time.RFC3339)
	return &s
}

func (s *PacienteService) buildPaciente(id uuid.UUID, in PacienteInput, requireLGPD bool) (*entity.Paciente, error) {
	unidades, err := normalizeUnidadeLinks(in.UnidadeLinks)
	if err != nil {
		return nil, err
	}

	cpf := normalizeOptionalCPF(in.CPF)
	respCPF := normalizeOptionalCPF(in.ResponsavelCPF)

	status := in.Status
	if status == "" {
		status = entity.PacienteAtivo
	}

	now := time.Now().UTC()
	p := &entity.Paciente{
		ID:                      id,
		NomeCompleto:            strings.TrimSpace(in.NomeCompleto),
		NomeSocial:              in.NomeSocial,
		DataNascimento:          in.DataNascimento,
		SexoBiologico:           in.SexoBiologico,
		CPF:                     cpf,
		RGNumero:                in.RGNumero,
		RGOrgao:                 in.RGOrgao,
		Foto:                    in.Foto,
		TelPrincipal:            strings.TrimSpace(in.TelPrincipal),
		TelSecundario:           in.TelSecundario,
		Email:                   in.Email,
		Endereco:                in.Endereco,
		Numero:                  in.Numero,
		Complemento:             in.Complemento,
		Bairro:                  in.Bairro,
		Cidade:                  in.Cidade,
		UF:                      strings.ToUpper(strings.TrimSpace(in.UF)),
		CEP:                     strings.TrimSpace(in.CEP),
		ResponsavelNome:         strings.TrimSpace(in.ResponsavelNome),
		ResponsavelCPF:          respCPF,
		ResponsavelParentesco:   in.ResponsavelParentesco,
		ResponsavelTel:          in.ResponsavelTel,
		ResponsavelEmail:        in.ResponsavelEmail,
		ContatoEmergenciaNome:   in.ContatoEmergenciaNome,
		ContatoEmergenciaTel:    in.ContatoEmergenciaTel,
		PessoasAutorizadasBusca: in.PessoasAutorizadasBusca,
		Escola:                  in.Escola,
		SerieAno:                in.SerieAno,
		NecessidadesEspeciais:   in.NecessidadesEspeciais,
		PediatraReferencia:      in.PediatraReferencia,
		Altura:                  in.Altura,
		Peso:                    in.Peso,
		TipoSanguineo:           in.TipoSanguineo,
		Alergias:                in.Alergias,
		DoencasCronicas:         in.DoencasCronicas,
		MedicacoesContinuo:      in.MedicacoesContinuo,
		CirurgiasPrevias:        in.CirurgiasPrevias,
		HistoricoFamiliar:       in.HistoricoFamiliar,
		Vacinas:                 in.Vacinas,
		Observacoes:             in.Observacoes,
		AtividadeFisicaFreq:     in.AtividadeFisicaFreq,
		AtividadeFisicaTipo:     in.AtividadeFisicaTipo,
		Alimentacao:             in.Alimentacao,
		SonoHoras:               in.SonoHoras,
		ProfissionalResponsavel: in.ProfissionalResponsavel,
		Status:                  status,
		ConsentimentoLGPD:       in.ConsentimentoLGPD,
		AutorizacaoUsoImagem:    in.AutorizacaoUsoImagem,
		AssinaturaDigital:       in.AssinaturaDigital,
		DocumentosAnexos:        in.DocumentosAnexos,
		Unidades:                unidades,
		UpdatedAt:               now,
	}
	if requireLGPD {
		p.CreatedAt = now
	}
	if err := p.Validate(requireLGPD); err != nil {
		return nil, err
	}
	return p, nil
}

func normalizeUnidadeLinks(links []UnidadeLinkInput) ([]entity.PacienteUnidadeLink, error) {
	if len(links) == 0 {
		return nil, domainerrors.NewRequiredFieldError("unidade_ids")
	}
	principalSet := false
	out := make([]entity.PacienteUnidadeLink, 0, len(links))
	for i, l := range links {
		if l.UnidadeID == uuid.Nil {
			return nil, domainerrors.NewInvalidFormatError("unidade_ids", "ID de unidade inválido")
		}
		principal := l.Principal
		if principal {
			if principalSet {
				return nil, domainerrors.NewValidationError("Apenas uma unidade pode ser principal")
			}
			principalSet = true
		}
		out = append(out, entity.PacienteUnidadeLink{
			UnidadeID: l.UnidadeID,
			Principal: principal,
			Ativo:     true,
		})
		_ = i
	}
	if !principalSet {
		out[0].Principal = true
	}
	return out, nil
}

func normalizeOptionalCPF(cpf *string) *string {
	if cpf == nil {
		return nil
	}
	n := entity.NormalizeCPF(*cpf)
	if n == "" {
		return nil
	}
	return &n
}

func (s *PacienteService) ensureCPFUnique(ctx context.Context, cpf *string, excludeID *uuid.UUID) error {
	if cpf == nil || *cpf == "" {
		return nil
	}
	exists, err := s.repo.ExistsCPF(ctx, *cpf, excludeID)
	if err != nil {
		return err
	}
	if exists {
		return domainerrors.NewConflictError("CPF já cadastrado para outro paciente")
	}
	return nil
}
