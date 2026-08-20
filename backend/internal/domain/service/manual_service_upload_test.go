package service

import (
	"context"
	"io"
	"log/slog"
	"os"
	"strings"
	"testing"
	"time"

	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/infrastructure/storage"

	"github.com/google/uuid"
)

type stubManualStore struct {
	items map[uuid.UUID]*ManualDTO
}

func (s *stubManualStore) Create(ctx context.Context, in ManualInput) (*ManualDTO, error) {
	return s.CreateWithID(ctx, uuid.New(), in)
}

func (s *stubManualStore) CreateWithID(ctx context.Context, id uuid.UUID, in ManualInput) (*ManualDTO, error) {
	now := time.Now().UTC().Format(time.RFC3339)
	dto := &ManualDTO{
		ID: id, Titulo: in.Titulo, Versao: in.Versao, PublicoAlvo: in.PublicoAlvo,
		ArquivoURL: in.ArquivoURL, ArquivoNome: in.ArquivoNome, Tags: in.Tags,
		Status: in.Status, Observacoes: in.Observacoes, CreatedBy: in.CreatedBy,
		CreatedAt: now, UpdatedAt: now,
	}
	s.items[id] = dto
	return dto, nil
}

func (s *stubManualStore) GetByID(_ context.Context, id uuid.UUID) (*ManualDTO, error) {
	return s.items[id], nil
}

func (s *stubManualStore) Update(_ context.Context, id uuid.UUID, in ManualInput) (*ManualDTO, error) {
	dto, ok := s.items[id]
	if !ok {
		return nil, nil
	}
	dto.Titulo = in.Titulo
	return dto, nil
}

func (s *stubManualStore) Delete(_ context.Context, id uuid.UUID) error {
	delete(s.items, id)
	return nil
}

func (s *stubManualStore) List(_ context.Context, _ repository.CRUDListFilter) (*ListResult[ManualDTO], error) {
	items := make([]ManualDTO, 0, len(s.items))
	for _, m := range s.items {
		items = append(items, *m)
	}
	return &ListResult[ManualDTO]{Items: items, Total: int64(len(items)), Page: 1, PageSize: 50, TotalPages: 1}, nil
}

func TestManualService_UploadAndDownload(t *testing.T) {
	dir := t.TempDir()
	fileStore, err := storage.NewLocalStorage(dir)
	if err != nil {
		t.Fatal(err)
	}
	store := &stubManualStore{items: map[uuid.UUID]*ManualDTO{}}
	policy := NewUploadPolicy(10*1024*1024, []string{"pdf"}, []string{"application/pdf"})
	svc := NewManualService(store, fileStore, policy, slog.New(slog.NewTextHandler(os.Stderr, nil)))
	ctx := context.Background()
	userID := uuid.New()

	dto, err := svc.Upload(ctx, ManualUploadInput{
		Titulo: "Manual Teste", Versao: "1.0", PublicoAlvo: "Interno",
		OriginalName: "doc.pdf", DeclaredMIME: "application/pdf", Size: 4,
		CreatedBy: userID,
	}, strings.NewReader("%PDF"))
	if err != nil {
		t.Fatalf("Upload: %v", err)
	}
	if dto.ArquivoNome != "doc.pdf" || dto.ArquivoURL == "" {
		t.Fatalf("metadados inesperados: %+v", dto)
	}

	meta, rc, err := svc.OpenDownload(ctx, dto.ID)
	if err != nil {
		t.Fatalf("OpenDownload: %v", err)
	}
	defer rc.Close()
	data, err := io.ReadAll(rc)
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != "%PDF" {
		t.Fatalf("conteúdo: %q", string(data))
	}
	if meta.ArquivoNome != "doc.pdf" {
		t.Fatalf("meta nome: %s", meta.ArquivoNome)
	}

	if err := svc.Delete(ctx, dto.ID); err != nil {
		t.Fatalf("Delete: %v", err)
	}
	if _, ok := store.items[dto.ID]; ok {
		t.Fatal("registro deveria ter sido removido")
	}
}
