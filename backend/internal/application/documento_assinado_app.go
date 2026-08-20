package application

import (
	"context"
	"io"
	"os"

	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type DocumentoAssinadoApp struct {
	svc *service.DocumentoAssinadoService
}

func NewDocumentoAssinadoApp(svc *service.DocumentoAssinadoService) *DocumentoAssinadoApp {
	return &DocumentoAssinadoApp{svc: svc}
}

func (a *DocumentoAssinadoApp) List(ctx context.Context, unidadeID uuid.UUID, page, pageSize int) ([]*service.DocumentoAssinadoDTO, int64, error) {
	return a.svc.List(ctx, unidadeID, page, pageSize)
}

func (a *DocumentoAssinadoApp) Assinar(ctx context.Context, unidadeID, actorID uuid.UUID, name, docType string, r io.Reader) (*service.DocumentoAssinadoDTO, error) {
	return a.svc.Assinar(ctx, unidadeID, actorID, name, docType, r)
}

func (a *DocumentoAssinadoApp) Verificar(ctx context.Context, id uuid.UUID) (*service.VerifyAssinaturaResult, error) {
	return a.svc.Verificar(ctx, id)
}

func (a *DocumentoAssinadoApp) OpenSignedDownload(ctx context.Context, id uuid.UUID) (string, *os.File, error) {
	return a.svc.OpenSignedDownload(ctx, id)
}
