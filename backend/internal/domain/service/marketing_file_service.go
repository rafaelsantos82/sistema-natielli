package service

import (
	"context"
	"io"
	"strings"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"

	"github.com/google/uuid"
)

var validPublicoAlvo = map[string]bool{
	"Interno": true, "Externo": true, "Ambos": true,
}

func validateManualUpload(in ManualUploadInput) error {
	if strings.TrimSpace(in.Titulo) == "" {
		return domainerrors.NewValidationError("título é obrigatório")
	}
	if strings.TrimSpace(in.Versao) == "" {
		return domainerrors.NewValidationError("versão é obrigatória")
	}
	pa := strings.TrimSpace(in.PublicoAlvo)
	if !validPublicoAlvo[pa] {
		return domainerrors.NewValidationError("público-alvo inválido")
	}
	if in.CreatedBy == uuid.Nil {
		return domainerrors.NewValidationError("usuário inválido")
	}
	return nil
}

func validateMaterialUpload(in MaterialMarketingUploadInput) error {
	if strings.TrimSpace(in.Titulo) == "" {
		return domainerrors.NewValidationError("título é obrigatório")
	}
	if strings.TrimSpace(in.Tipo) == "" {
		return domainerrors.NewValidationError("tipo é obrigatório")
	}
	if in.CreatedBy == uuid.Nil {
		return domainerrors.NewValidationError("usuário inválido")
	}
	return nil
}

func manualStatusOrDefault(status string) string {
	s := strings.TrimSpace(status)
	switch s {
	case "Rascunho", "Publicado", "Arquivado":
		return s
	default:
		return "Rascunho"
	}
}

func materialStatusOrDefault(status string) string {
	s := strings.TrimSpace(status)
	switch s {
	case "Rascunho", "Aprovado", "Publicado", "Arquivado":
		return s
	default:
		return "Rascunho"
	}
}

func (s *ManualService) Upload(ctx context.Context, in ManualUploadInput, reader io.Reader) (*ManualDTO, error) {
	if err := validateManualUpload(in); err != nil {
		return nil, err
	}
	if err := s.policy.ValidateUpload(in.OriginalName, in.DeclaredMIME, in.Size); err != nil {
		return nil, domainerrors.NewValidationError(err.Error())
	}
	manualID := uuid.New()
	safeName := SanitizeOriginalFilename(in.OriginalName)
	rel, _, err := s.fileStore.StoreMarketingManual(manualID, safeName, reader)
	if err != nil {
		return nil, domainerrors.NewDatabaseError("falha ao armazenar arquivo", err)
	}
	inCreate := ManualInput{
		Titulo:      strings.TrimSpace(in.Titulo),
		Versao:      strings.TrimSpace(in.Versao),
		PublicoAlvo: strings.TrimSpace(in.PublicoAlvo),
		ArquivoURL:  rel,
		ArquivoNome: in.OriginalName,
		Tags:        in.Tags,
		Status:      manualStatusOrDefault(in.Status),
		Observacoes: in.Observacoes,
		CreatedBy:   in.CreatedBy,
	}
	out, err := s.store.CreateWithID(ctx, manualID, inCreate)
	if err != nil {
		_ = s.fileStore.RemoveRelative(rel)
		return nil, err
	}
	LogMutation(ctx, s.logger, "manual", "upload", out.ID)
	return out, nil
}

func (s *ManualService) OpenDownload(ctx context.Context, id uuid.UUID) (*ManualDownloadMeta, io.ReadCloser, error) {
	out, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	if strings.TrimSpace(out.ArquivoURL) == "" {
		return nil, nil, domainerrors.NewNotFoundError("arquivo", id.String())
	}
	f, err := s.fileStore.OpenRelative(out.ArquivoURL)
	if err != nil {
		return nil, nil, domainerrors.NewNotFoundError("arquivo", id.String())
	}
	mime := s.policy.ResolveMIME(out.ArquivoNome, "")
	return &ManualDownloadMeta{
		ID:          out.ID,
		ArquivoNome: out.ArquivoNome,
		MimeType:    mime,
	}, f, nil
}

func (s *MaterialMarketingService) Upload(ctx context.Context, in MaterialMarketingUploadInput, reader io.Reader) (*MaterialMarketingDTO, error) {
	if err := validateMaterialUpload(in); err != nil {
		return nil, err
	}
	if err := s.policy.ValidateUpload(in.OriginalName, in.DeclaredMIME, in.Size); err != nil {
		return nil, domainerrors.NewValidationError(err.Error())
	}
	materialID := uuid.New()
	safeName := SanitizeOriginalFilename(in.OriginalName)
	rel, _, err := s.fileStore.StoreMarketingMaterial(materialID, safeName, reader)
	if err != nil {
		return nil, domainerrors.NewDatabaseError("falha ao armazenar arquivo", err)
	}
	inCreate := MaterialMarketingInput{
		Titulo:      strings.TrimSpace(in.Titulo),
		Tipo:        strings.TrimSpace(in.Tipo),
		ArquivoURL:  rel,
		ArquivoNome: in.OriginalName,
		Tags:        in.Tags,
		Campanha:    in.Campanha,
		UnidadeID:   in.UnidadeID,
		Status:      materialStatusOrDefault(in.Status),
		Observacoes: in.Observacoes,
		CreatedBy:   in.CreatedBy,
	}
	out, err := s.store.CreateWithID(ctx, materialID, inCreate)
	if err != nil {
		_ = s.fileStore.RemoveRelative(rel)
		return nil, err
	}
	LogMutation(ctx, s.logger, "material_marketing", "upload", out.ID)
	return out, nil
}

func (s *MaterialMarketingService) OpenDownload(ctx context.Context, id uuid.UUID) (*MaterialMarketingDownloadMeta, io.ReadCloser, error) {
	out, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	if strings.TrimSpace(out.ArquivoURL) == "" {
		return nil, nil, domainerrors.NewNotFoundError("arquivo", id.String())
	}
	f, err := s.fileStore.OpenRelative(out.ArquivoURL)
	if err != nil {
		return nil, nil, domainerrors.NewNotFoundError("arquivo", id.String())
	}
	mime := s.policy.ResolveMIME(out.ArquivoNome, "")
	return &MaterialMarketingDownloadMeta{
		ID:          out.ID,
		ArquivoNome: out.ArquivoNome,
		MimeType:    mime,
	}, f, nil
}
