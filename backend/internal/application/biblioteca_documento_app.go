package application

import (
	"context"
	"io"

	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type BibliotecaDocumentoApp struct {
	svc *service.BibliotecaDocumentoService
}

func NewBibliotecaDocumentoApp(svc *service.BibliotecaDocumentoService) *BibliotecaDocumentoApp {
	return &BibliotecaDocumentoApp{svc: svc}
}

func (a *BibliotecaDocumentoApp) ListCategorias(ctx context.Context, includeInativas bool) ([]*service.DocumentoCategoriaDTO, error) {
	return a.svc.ListCategorias(ctx, includeInativas)
}

func (a *BibliotecaDocumentoApp) GetCategoria(ctx context.Context, id uuid.UUID) (*service.DocumentoCategoriaDTO, error) {
	return a.svc.GetCategoria(ctx, id)
}

func (a *BibliotecaDocumentoApp) CreateCategoria(ctx context.Context, in service.CreateDocumentoCategoriaInput) (*service.DocumentoCategoriaDTO, error) {
	return a.svc.CreateCategoria(ctx, in)
}

func (a *BibliotecaDocumentoApp) UpdateCategoria(ctx context.Context, id uuid.UUID, in service.UpdateDocumentoCategoriaInput) (*service.DocumentoCategoriaDTO, error) {
	return a.svc.UpdateCategoria(ctx, id, in)
}

func (a *BibliotecaDocumentoApp) DeleteCategoria(ctx context.Context, id uuid.UUID) error {
	return a.svc.DeleteCategoria(ctx, id)
}

func (a *BibliotecaDocumentoApp) ListArquivos(ctx context.Context, filter repository.BibliotecaArquivoListFilter) (*service.BibliotecaArquivoListOutput, error) {
	return a.svc.ListArquivos(ctx, filter)
}

func (a *BibliotecaDocumentoApp) Upload(ctx context.Context, in service.BibliotecaArquivoUploadInput, reader io.Reader) (*service.BibliotecaArquivoDTO, error) {
	return a.svc.Upload(ctx, in, reader)
}

func (a *BibliotecaDocumentoApp) OpenDownload(ctx context.Context, id uuid.UUID) (*service.BibliotecaArquivoDTO, io.ReadCloser, error) {
	arq, f, err := a.svc.OpenDownload(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	return service.BibliotecaArquivoToDTO(arq), f, nil
}

func (a *BibliotecaDocumentoApp) DeleteArquivo(ctx context.Context, id uuid.UUID) error {
	return a.svc.DeleteArquivo(ctx, id)
}
