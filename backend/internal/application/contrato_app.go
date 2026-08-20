package application

import (
	"context"
	"io"

	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
)

type ContratoApp struct {
	svc *service.ContratoService
}

func NewContratoApp(svc *service.ContratoService) *ContratoApp {
	return &ContratoApp{svc: svc}
}

func (a *ContratoApp) List(ctx context.Context, f service.ContratoListFilter) (*service.ListResult[service.ContratoDTO], error) {
	return a.svc.List(ctx, f)
}

func (a *ContratoApp) GetByID(ctx context.Context, id uuid.UUID) (*service.ContratoDTO, error) {
	return a.svc.GetByID(ctx, id)
}

func (a *ContratoApp) CreateWithArquivo(
	ctx context.Context,
	in service.ContratoInput,
	fileIn service.ContratoArquivoUploadInput,
	reader io.Reader,
) (*service.ContratoDTO, error) {
	return a.svc.CreateWithArquivo(ctx, in, fileIn, reader)
}

func (a *ContratoApp) Update(ctx context.Context, id uuid.UUID, in service.ContratoInput) (*service.ContratoDTO, error) {
	return a.svc.Update(ctx, id, in)
}

func (a *ContratoApp) ReplaceArquivo(
	ctx context.Context,
	id uuid.UUID,
	fileIn service.ContratoArquivoUploadInput,
	reader io.Reader,
) (*service.ContratoDTO, error) {
	return a.svc.ReplaceArquivo(ctx, id, fileIn, reader)
}

func (a *ContratoApp) OpenDownload(ctx context.Context, id uuid.UUID) (*service.ContratoArquivoMeta, io.ReadCloser, error) {
	return a.svc.OpenDownload(ctx, id)
}

func (a *ContratoApp) OpenDownloadCompartilhadoPublic(ctx context.Context, token string) (*service.ContratoArquivoMeta, io.ReadCloser, error) {
	return a.svc.OpenDownloadCompartilhadoPublic(ctx, token)
}

func (a *ContratoApp) OpenDownloadAssinaturaPublic(ctx context.Context, token string) (*service.ContratoArquivoMeta, io.ReadCloser, error) {
	return a.svc.OpenDownloadAssinaturaPublic(ctx, token)
}

func (a *ContratoApp) SoftDelete(ctx context.Context, id uuid.UUID) error {
	return a.svc.SoftDelete(ctx, id)
}

func (a *ContratoApp) Compartilhar(ctx context.Context, id uuid.UUID, in service.CompartilharContratoInput) (*service.CompartilharContratoResult, error) {
	return a.svc.Compartilhar(ctx, id, in)
}

func (a *ContratoApp) SolicitarAssinatura(ctx context.Context, id uuid.UUID, in service.SolicitarAssinaturaInput) (*service.SolicitarAssinaturaResult, error) {
	return a.svc.SolicitarAssinatura(ctx, id, in)
}

func (a *ContratoApp) GetCompartilhadoPublic(ctx context.Context, token string) (*service.ContratoCompartilhadoPublicDTO, error) {
	return a.svc.GetCompartilhadoPublic(ctx, token)
}

func (a *ContratoApp) RecordAcessoCompartilhado(ctx context.Context, token, ip string) error {
	return a.svc.RecordAcessoCompartilhado(ctx, token, ip)
}

func (a *ContratoApp) GetAssinaturaPublic(ctx context.Context, token string) (*service.ContratoAssinaturaPublicDTO, error) {
	return a.svc.GetAssinaturaPublic(ctx, token)
}

func (a *ContratoApp) AceitarAssinatura(ctx context.Context, token, observacoes, ip string) error {
	return a.svc.AceitarAssinatura(ctx, token, observacoes, ip)
}
