package application

import (
	"context"
	"io"

	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type ProfissionalDocumentoApp struct {
	svc *service.ProfissionalDocumentoService
}

func NewProfissionalDocumentoApp(svc *service.ProfissionalDocumentoService) *ProfissionalDocumentoApp {
	return &ProfissionalDocumentoApp{svc: svc}
}

func (a *ProfissionalDocumentoApp) List(ctx context.Context, profissionalID uuid.UUID, categoria *string) ([]*service.ProfissionalDocumentoDTO, error) {
	return a.svc.List(ctx, profissionalID, categoria)
}

type DocumentoDownload struct {
	Meta *service.ProfissionalDocumentoDTO
	File io.ReadCloser
}

func (a *ProfissionalDocumentoApp) Upload(ctx context.Context, in service.ProfissionalDocumentoUploadInput, reader io.Reader) (*service.ProfissionalDocumentoDTO, error) {
	return a.svc.Upload(ctx, in, reader)
}

func (a *ProfissionalDocumentoApp) OpenDownload(ctx context.Context, profissionalID, docID uuid.UUID) (*DocumentoDownload, error) {
	doc, rc, err := a.svc.OpenDownload(ctx, profissionalID, docID)
	if err != nil {
		return nil, err
	}
	return &DocumentoDownload{
		Meta: &service.ProfissionalDocumentoDTO{
			ID:             doc.ID,
			ProfissionalID: doc.ProfissionalID,
			Categoria:      string(doc.Categoria),
			Obrigatorio:    doc.Obrigatorio,
			NomeArquivo:    doc.NomeArquivo,
			MimeType:       doc.MimeType,
			TamanhoBytes:   doc.TamanhoBytes,
			Versao:         doc.Versao,
			Substitui:      doc.Substitui,
			UploadedAt:     doc.UploadedAt,
			UploadedBy:     doc.UploadedBy,
		},
		File: rc,
	}, nil
}

func (a *ProfissionalDocumentoApp) Delete(ctx context.Context, profissionalID, docID uuid.UUID) error {
	return a.svc.Delete(ctx, profissionalID, docID)
}

func (a *ProfissionalDocumentoApp) PendenciasSummary(ctx context.Context) ([]service.ProfissionalDocPendenciaDTO, error) {
	return a.svc.PendenciasSummary(ctx)
}

func (a *ProfissionalDocumentoApp) ListAll(ctx context.Context) ([]*service.ProfissionalDocumentoDTO, error) {
	return a.svc.ListAll(ctx)
}
