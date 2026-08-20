package service

import (
	"context"
	"io"
	"log/slog"
	"strings"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/infrastructure/storage"

	"github.com/google/uuid"
)

type BibliotecaDocumentoService struct {
	categorias repository.DocumentoCategoriaRepository
	arquivos   repository.BibliotecaArquivoRepository
	store      *storage.LocalStorage
	policy     UploadPolicy
	logger     *slog.Logger
}

func NewBibliotecaDocumentoService(
	categorias repository.DocumentoCategoriaRepository,
	arquivos repository.BibliotecaArquivoRepository,
	store *storage.LocalStorage,
	policy UploadPolicy,
	logger *slog.Logger,
) *BibliotecaDocumentoService {
	return &BibliotecaDocumentoService{
		categorias: categorias,
		arquivos:   arquivos,
		store:      store,
		policy:     policy,
		logger:     logger,
	}
}

func (s *BibliotecaDocumentoService) ListCategorias(ctx context.Context, includeInativas bool) ([]*DocumentoCategoriaDTO, error) {
	items, err := s.categorias.List(ctx, repository.DocumentoCategoriaListFilter{IncludeInativas: includeInativas})
	if err != nil {
		return nil, err
	}
	out := make([]*DocumentoCategoriaDTO, 0, len(items))
	for _, c := range items {
		if c.DeletedAt != nil {
			continue
		}
		out = append(out, toDocumentoCategoriaDTO(c))
	}
	return out, nil
}

func (s *BibliotecaDocumentoService) GetCategoria(ctx context.Context, id uuid.UUID) (*DocumentoCategoriaDTO, error) {
	c, err := s.categorias.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if c == nil || c.DeletedAt != nil {
		return nil, domainerrors.NewNotFoundError("categoria", id.String())
	}
	return toDocumentoCategoriaDTO(c), nil
}

func (s *BibliotecaDocumentoService) CreateCategoria(ctx context.Context, in CreateDocumentoCategoriaInput) (*DocumentoCategoriaDTO, error) {
	nome := strings.TrimSpace(in.Nome)
	if nome == "" {
		return nil, domainerrors.NewValidationError("nome é obrigatório")
	}
	exists, err := s.categorias.ExistsNome(ctx, nome, nil)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domainerrors.NewConflictError("Já existe uma categoria com este nome")
	}
	now := time.Now().UTC()
	cat := &entity.BibliotecaCategoria{
		ID:        uuid.New(),
		Nome:      nome,
		Descricao: strings.TrimSpace(in.Descricao),
		Ordem:     in.Ordem,
		Ativo:     in.Ativo,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := s.categorias.Create(ctx, cat); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "biblioteca_categoria", "create", cat.ID)
	return toDocumentoCategoriaDTO(cat), nil
}

func (s *BibliotecaDocumentoService) UpdateCategoria(ctx context.Context, id uuid.UUID, in UpdateDocumentoCategoriaInput) (*DocumentoCategoriaDTO, error) {
	c, err := s.categorias.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if c == nil || c.DeletedAt != nil {
		return nil, domainerrors.NewNotFoundError("categoria", id.String())
	}
	nome := strings.TrimSpace(in.Nome)
	if nome == "" {
		return nil, domainerrors.NewValidationError("nome é obrigatório")
	}
	exists, err := s.categorias.ExistsNome(ctx, nome, &id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domainerrors.NewConflictError("Já existe uma categoria com este nome")
	}
	c.Nome = nome
	c.Descricao = strings.TrimSpace(in.Descricao)
	c.Ordem = in.Ordem
	c.Ativo = in.Ativo
	c.UpdatedAt = time.Now().UTC()
	if err := s.categorias.Update(ctx, c); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "biblioteca_categoria", "update", id)
	return toDocumentoCategoriaDTO(c), nil
}

func (s *BibliotecaDocumentoService) DeleteCategoria(ctx context.Context, id uuid.UUID) error {
	c, err := s.categorias.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if c == nil || c.DeletedAt != nil {
		return domainerrors.NewNotFoundError("categoria", id.String())
	}
	count, err := s.arquivos.CountActiveByCategoria(ctx, id)
	if err != nil {
		return err
	}
	if count > 0 {
		return domainerrors.NewConflictError("Não é possível excluir a categoria: existem documentos vinculados. Remova os arquivos antes.")
	}
	if err := s.categorias.SoftDelete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "biblioteca_categoria", "delete", id)
	return nil
}

func (s *BibliotecaDocumentoService) ListArquivos(ctx context.Context, filter repository.BibliotecaArquivoListFilter) (*BibliotecaArquivoListOutput, error) {
	result, err := s.arquivos.List(ctx, filter)
	if err != nil {
		return nil, err
	}
	items := make([]*BibliotecaArquivoDTO, 0, len(result.Items))
	for _, a := range result.Items {
		items = append(items, toBibliotecaArquivoDTO(a))
	}
	return &BibliotecaArquivoListOutput{
		Items:      items,
		Total:      result.Total,
		Page:       result.Page,
		PageSize:   result.PageSize,
		TotalPages: result.TotalPages,
	}, nil
}

func (s *BibliotecaDocumentoService) Upload(ctx context.Context, in BibliotecaArquivoUploadInput, reader io.Reader) (*BibliotecaArquivoDTO, error) {
	cat, err := s.categorias.FindByID(ctx, in.CategoriaID)
	if err != nil {
		return nil, err
	}
	if cat == nil || cat.DeletedAt != nil || !cat.Ativo {
		return nil, domainerrors.NewNotFoundError("categoria", in.CategoriaID.String())
	}
	if err := s.policy.ValidateUpload(in.OriginalName, in.DeclaredMIME, in.Size); err != nil {
		return nil, domainerrors.NewValidationError(err.Error())
	}
	mime := s.policy.ResolveMIME(in.OriginalName, in.DeclaredMIME)
	docID := uuid.New()
	safeName := SanitizeOriginalFilename(in.OriginalName)
	rel, written, err := s.store.StoreBibliotecaArquivo(in.CategoriaID, docID, safeName, reader)
	if err != nil {
		return nil, domainerrors.NewDatabaseError("falha ao armazenar arquivo", err)
	}
	titulo := strings.TrimSpace(in.Titulo)
	if titulo == "" {
		titulo = in.OriginalName
	}
	now := time.Now().UTC()
	arq := &entity.BibliotecaArquivo{
		ID:           docID,
		CategoriaID:  in.CategoriaID,
		Titulo:       titulo,
		NomeArquivo:  in.OriginalName,
		MimeType:     mime,
		TamanhoBytes: written,
		StoragePath:  rel,
		UploadedBy:   in.UploadedBy,
		UploadedAt:   now,
	}
	if err := s.arquivos.Create(ctx, arq); err != nil {
		return nil, err
	}
	LogMutation(ctx, s.logger, "biblioteca_arquivo", "create", docID)
	dto, err := s.getArquivoDTO(ctx, docID)
	if err != nil {
		return toBibliotecaArquivoDTO(arq), nil
	}
	return dto, nil
}

func (s *BibliotecaDocumentoService) OpenDownload(ctx context.Context, id uuid.UUID) (*entity.BibliotecaArquivo, io.ReadCloser, error) {
	arq, err := s.arquivos.FindByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	if arq == nil || arq.DeletedAt != nil {
		return nil, nil, domainerrors.NewNotFoundError("documento", id.String())
	}
	f, err := s.store.OpenRelative(arq.StoragePath)
	if err != nil {
		return nil, nil, domainerrors.NewNotFoundError("arquivo", id.String())
	}
	return arq, f, nil
}

func (s *BibliotecaDocumentoService) DeleteArquivo(ctx context.Context, id uuid.UUID) error {
	arq, err := s.arquivos.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if arq == nil || arq.DeletedAt != nil {
		return domainerrors.NewNotFoundError("documento", id.String())
	}
	if err := s.arquivos.SoftDelete(ctx, id); err != nil {
		return err
	}
	LogMutation(ctx, s.logger, "biblioteca_arquivo", "delete", id)
	return nil
}

func (s *BibliotecaDocumentoService) getArquivoDTO(ctx context.Context, id uuid.UUID) (*BibliotecaArquivoDTO, error) {
	arq, err := s.arquivos.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if arq == nil {
		return nil, domainerrors.NewNotFoundError("documento", id.String())
	}
	return toBibliotecaArquivoDTO(arq), nil
}

func toDocumentoCategoriaDTO(c *entity.BibliotecaCategoria) *DocumentoCategoriaDTO {
	var desc *string
	if c.Descricao != "" {
		d := c.Descricao
		desc = &d
	}
	return &DocumentoCategoriaDTO{
		ID:        c.ID.String(),
		Nome:      c.Nome,
		Descricao: desc,
		Ordem:     c.Ordem,
		Ativo:     c.Ativo,
		CreatedAt: c.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: c.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func BibliotecaArquivoToDTO(a *entity.BibliotecaArquivo) *BibliotecaArquivoDTO {
	return toBibliotecaArquivoDTO(a)
}

func toBibliotecaArquivoDTO(a *entity.BibliotecaArquivo) *BibliotecaArquivoDTO {
	return &BibliotecaArquivoDTO{
		ID:             a.ID.String(),
		CategoriaID:    a.CategoriaID.String(),
		CategoriaNome:  a.CategoriaNome,
		Titulo:         a.Titulo,
		NomeArquivo:    a.NomeArquivo,
		MimeType:       a.MimeType,
		TamanhoBytes:   a.TamanhoBytes,
		UploadedAt:     a.UploadedAt.UTC().Format(time.RFC3339),
		UploadedBy:     a.UploadedBy.String(),
		UploadedByNome: a.UploadedByNome,
	}
}
