package service

import (
	"context"
	"io"
	"log/slog"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/infrastructure/storage"

	"github.com/google/uuid"
)

var obrigatorioCategorias = map[entity.DocumentoCategoria]bool{
	entity.DocumentoCategoriaPessoal:  true,
	entity.DocumentoCategoriaRegistro: true,
}

type ProfissionalDocumentoService struct {
	docs           repository.ProfissionalDocumentoRepository
	profissionais  repository.ProfissionalRepository
	store          *storage.LocalStorage
	policy         UploadPolicy
	logger         *slog.Logger
}

func NewProfissionalDocumentoService(
	docs repository.ProfissionalDocumentoRepository,
	profissionais repository.ProfissionalRepository,
	store *storage.LocalStorage,
	policy UploadPolicy,
	logger *slog.Logger,
) *ProfissionalDocumentoService {
	return &ProfissionalDocumentoService{
		docs:          docs,
		profissionais: profissionais,
		store:         store,
		policy:        policy,
		logger:        logger,
	}
}

func (s *ProfissionalDocumentoService) ListAll(ctx context.Context) ([]*ProfissionalDocumentoDTO, error) {
	all, err := s.docs.ListAllActive(ctx)
	if err != nil {
		return nil, err
	}
	active := filterActiveVersions(all)
	out := make([]*ProfissionalDocumentoDTO, 0, len(active))
	for _, d := range active {
		out = append(out, toProfissionalDocumentoDTO(d))
	}
	return out, nil
}

func (s *ProfissionalDocumentoService) List(ctx context.Context, profissionalID uuid.UUID, categoria *string) ([]*ProfissionalDocumentoDTO, error) {
	if err := s.ensureProfissional(ctx, profissionalID); err != nil {
		return nil, err
	}
	filter := repository.ProfissionalDocumentoListFilter{ProfissionalID: profissionalID}
	if categoria != nil && *categoria != "" {
		cat := entity.DocumentoCategoria(*categoria)
		if !cat.Valid() {
			return nil, domainerrors.NewValidationError("categoria inválida")
		}
		filter.Categoria = &cat
	}
	all, err := s.docs.List(ctx, filter)
	if err != nil {
		return nil, err
	}
	active := filterActiveVersions(all)
	out := make([]*ProfissionalDocumentoDTO, 0, len(active))
	for _, d := range active {
		out = append(out, toProfissionalDocumentoDTO(d))
	}
	return out, nil
}

func (s *ProfissionalDocumentoService) Upload(ctx context.Context, in ProfissionalDocumentoUploadInput, reader io.Reader) (*ProfissionalDocumentoDTO, error) {
	if err := s.ensureProfissional(ctx, in.ProfissionalID); err != nil {
		return nil, err
	}
	cat := entity.DocumentoCategoria(in.Categoria)
	if !cat.Valid() {
		return nil, domainerrors.NewValidationError("categoria inválida")
	}
	if err := s.policy.ValidateUpload(in.OriginalName, in.DeclaredMIME, in.Size); err != nil {
		return nil, domainerrors.NewValidationError(err.Error())
	}
	mime := s.policy.ResolveMIME(in.OriginalName, in.DeclaredMIME)
	versao := 1
	if in.Substitui != nil {
		prev, err := s.docs.FindByID(ctx, *in.Substitui)
		if err != nil {
			return nil, err
		}
		if prev == nil || prev.ProfissionalID != in.ProfissionalID {
			return nil, domainerrors.NewNotFoundError("documento anterior", in.Substitui.String())
		}
		versao = prev.Versao + 1
	}
	docID := uuid.New()
	safeName := SanitizeOriginalFilename(in.OriginalName)
	rel, written, err := s.store.StoreProfissionalDocument(in.ProfissionalID, string(cat), docID, safeName, reader)
	if err != nil {
		return nil, domainerrors.NewDatabaseError("falha ao armazenar arquivo", err)
	}
	obr := in.Obrigatorio || obrigatorioCategorias[cat]
	doc := &entity.ProfissionalDocumento{
		ID:             docID,
		ProfissionalID: in.ProfissionalID,
		Categoria:      cat,
		Obrigatorio:    obr,
		NomeArquivo:    in.OriginalName,
		MimeType:       mime,
		TamanhoBytes:   written,
		StoragePath:    rel,
		Versao:         versao,
		Substitui:      in.Substitui,
		UploadedAt:     time.Now().UTC(),
		UploadedBy:     in.UploadedBy,
	}
	if err := s.docs.Create(ctx, doc); err != nil {
		return nil, err
	}
	return toProfissionalDocumentoDTO(doc), nil
}

func (s *ProfissionalDocumentoService) OpenDownload(ctx context.Context, profissionalID, docID uuid.UUID) (*entity.ProfissionalDocumento, io.ReadCloser, error) {
	doc, err := s.getOwned(ctx, profissionalID, docID)
	if err != nil {
		return nil, nil, err
	}
	f, err := s.store.OpenRelative(doc.StoragePath)
	if err != nil {
		return nil, nil, domainerrors.NewNotFoundError("arquivo", docID.String())
	}
	return doc, f, nil
}

func (s *ProfissionalDocumentoService) Delete(ctx context.Context, profissionalID, docID uuid.UUID) error {
	if _, err := s.getOwned(ctx, profissionalID, docID); err != nil {
		return err
	}
	return s.docs.SoftDelete(ctx, docID)
}

func (s *ProfissionalDocumentoService) getOwned(ctx context.Context, profissionalID, docID uuid.UUID) (*entity.ProfissionalDocumento, error) {
	doc, err := s.docs.FindByID(ctx, docID)
	if err != nil {
		return nil, err
	}
	if doc == nil || doc.DeletedAt != nil {
		return nil, domainerrors.NewNotFoundError("documento", docID.String())
	}
	if doc.ProfissionalID != profissionalID {
		return nil, domainerrors.NewForbiddenError("documento não pertence a este profissional")
	}
	return doc, nil
}

func (s *ProfissionalDocumentoService) ensureProfissional(ctx context.Context, id uuid.UUID) error {
	p, err := s.profissionais.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if p == nil {
		return domainerrors.NewNotFoundError("profissional", id.String())
	}
	return nil
}

func filterActiveVersions(all []*entity.ProfissionalDocumento) []*entity.ProfissionalDocumento {
	substituidos := make(map[uuid.UUID]struct{})
	for _, d := range all {
		if d.Substitui != nil {
			substituidos[*d.Substitui] = struct{}{}
		}
	}
	out := make([]*entity.ProfissionalDocumento, 0, len(all))
	for _, d := range all {
		if d.DeletedAt != nil {
			continue
		}
		if _, ok := substituidos[d.ID]; ok {
			continue
		}
		out = append(out, d)
	}
	return out
}

func toProfissionalDocumentoDTO(d *entity.ProfissionalDocumento) *ProfissionalDocumentoDTO {
	return &ProfissionalDocumentoDTO{
		ID:             d.ID,
		ProfissionalID: d.ProfissionalID,
		Categoria:      string(d.Categoria),
		Obrigatorio:    d.Obrigatorio,
		NomeArquivo:    d.NomeArquivo,
		MimeType:       d.MimeType,
		TamanhoBytes:   d.TamanhoBytes,
		Versao:         d.Versao,
		Substitui:      d.Substitui,
		UploadedAt:     d.UploadedAt,
		UploadedBy:     d.UploadedBy,
	}
}


type ProfissionalDocPendenciaDTO struct {
	ProfissionalID uuid.UUID `json:"profissional_id"`
	Pendentes      []string  `json:"pendentes"`
}

func (s *ProfissionalDocumentoService) PendenciasSummary(ctx context.Context) ([]ProfissionalDocPendenciaDTO, error) {
	all, err := s.docs.ListAllActive(ctx)
	if err != nil {
		return nil, err
	}
	active := filterActiveVersions(all)
	byProf := make(map[uuid.UUID]map[entity.DocumentoCategoria]bool)
	for _, d := range active {
		if byProf[d.ProfissionalID] == nil {
			byProf[d.ProfissionalID] = make(map[entity.DocumentoCategoria]bool)
		}
		byProf[d.ProfissionalID][d.Categoria] = true
	}
	out := make([]ProfissionalDocPendenciaDTO, 0)
	for profID, cats := range byProf {
		var pendentes []string
		for cat := range obrigatorioCategorias {
			if !cats[cat] {
				pendentes = append(pendentes, string(cat))
			}
		}
		if len(pendentes) > 0 {
			out = append(out, ProfissionalDocPendenciaDTO{ProfissionalID: profID, Pendentes: pendentes})
		}
	}
	return out, nil
}
