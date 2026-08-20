package service

import (
	"context"
	"io"
	"log/slog"
	"os"
	"strings"
	"testing"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/infrastructure/storage"

	"github.com/google/uuid"
)

type stubCatRepo struct {
	cats    map[uuid.UUID]*entity.BibliotecaCategoria
	byNome  map[string]uuid.UUID
}

func (s *stubCatRepo) Create(_ context.Context, cat *entity.BibliotecaCategoria) error {
	s.cats[cat.ID] = cat
	s.byNome[strings.ToLower(cat.Nome)] = cat.ID
	return nil
}
func (s *stubCatRepo) Update(_ context.Context, cat *entity.BibliotecaCategoria) error {
	s.cats[cat.ID] = cat
	s.byNome[strings.ToLower(cat.Nome)] = cat.ID
	return nil
}
func (s *stubCatRepo) FindByID(_ context.Context, id uuid.UUID) (*entity.BibliotecaCategoria, error) {
	return s.cats[id], nil
}
func (s *stubCatRepo) List(_ context.Context, _ repository.DocumentoCategoriaListFilter) ([]*entity.BibliotecaCategoria, error) {
	out := make([]*entity.BibliotecaCategoria, 0, len(s.cats))
	for _, c := range s.cats {
		out = append(out, c)
	}
	return out, nil
}
func (s *stubCatRepo) SoftDelete(_ context.Context, id uuid.UUID) error {
	delete(s.cats, id)
	return nil
}
func (s *stubCatRepo) ExistsNome(_ context.Context, nome string, excludeID *uuid.UUID) (bool, error) {
	id, ok := s.byNome[strings.ToLower(strings.TrimSpace(nome))]
	if !ok {
		return false, nil
	}
	if excludeID != nil && id == *excludeID {
		return false, nil
	}
	return true, nil
}

type stubArqRepo struct {
	arquivos map[uuid.UUID]*entity.BibliotecaArquivo
	byCat    map[uuid.UUID]int64
}

func (s *stubArqRepo) Create(_ context.Context, arq *entity.BibliotecaArquivo) error {
	s.arquivos[arq.ID] = arq
	s.byCat[arq.CategoriaID]++
	return nil
}
func (s *stubArqRepo) FindByID(_ context.Context, id uuid.UUID) (*entity.BibliotecaArquivo, error) {
	return s.arquivos[id], nil
}
func (s *stubArqRepo) List(_ context.Context, _ repository.BibliotecaArquivoListFilter) (*repository.BibliotecaArquivoListResult, error) {
	items := make([]*entity.BibliotecaArquivo, 0, len(s.arquivos))
	for _, a := range s.arquivos {
		items = append(items, a)
	}
	return &repository.BibliotecaArquivoListResult{Items: items, Total: int64(len(items)), Page: 1, PageSize: 50, TotalPages: 1}, nil
}
func (s *stubArqRepo) SoftDelete(_ context.Context, id uuid.UUID) error {
	if a, ok := s.arquivos[id]; ok {
		s.byCat[a.CategoriaID]--
		delete(s.arquivos, id)
	}
	return nil
}
func (s *stubArqRepo) CountActiveByCategoria(_ context.Context, categoriaID uuid.UUID) (int64, error) {
	return s.byCat[categoriaID], nil
}

func newBibliotecaTestService(t *testing.T) (*BibliotecaDocumentoService, uuid.UUID) {
	t.Helper()
	dir := t.TempDir()
	store, err := storage.NewLocalStorage(dir)
	if err != nil {
		t.Fatal(err)
	}
	catID := uuid.New()
	cats := &stubCatRepo{
		cats: map[uuid.UUID]*entity.BibliotecaCategoria{
			catID: {ID: catID, Nome: "Políticas", Ativo: true},
		},
		byNome: map[string]uuid.UUID{"políticas": catID},
	}
	arqs := &stubArqRepo{arquivos: map[uuid.UUID]*entity.BibliotecaArquivo{}, byCat: map[uuid.UUID]int64{}}
	svc := NewBibliotecaDocumentoService(cats, arqs, store, NewUploadPolicy(10*1024*1024, []string{"pdf"}, []string{"application/pdf"}), slog.New(slog.NewTextHandler(os.Stderr, nil)))
	return svc, catID
}

func TestBibliotecaDocumentoService_DeleteCategoriaWithArquivos409(t *testing.T) {
	svc, catID := newBibliotecaTestService(t)
	ctx := context.Background()
	userID := uuid.New()
	_, err := svc.Upload(ctx, BibliotecaArquivoUploadInput{
		CategoriaID:  catID,
		OriginalName: "doc.pdf",
		DeclaredMIME: "application/pdf",
		Size:         4,
		UploadedBy:   userID,
	}, strings.NewReader("%PDF"))
	if err != nil {
		t.Fatal(err)
	}
	err = svc.DeleteCategoria(ctx, catID)
	if err == nil {
		t.Fatal("expected conflict")
	}
	if de := domainerrors.GetDomainError(err); de == nil || de.Code != domainerrors.ErrorCodeConflict {
		t.Fatalf("expected conflict, got %v", err)
	}
}

func TestBibliotecaDocumentoService_UploadInvalidExtension(t *testing.T) {
	svc, catID := newBibliotecaTestService(t)
	_, err := svc.Upload(context.Background(), BibliotecaArquivoUploadInput{
		CategoriaID:  catID,
		OriginalName: "virus.exe",
		Size:         10,
		UploadedBy:   uuid.New(),
	}, strings.NewReader("bad"))
	if err == nil {
		t.Fatal("expected validation error")
	}
}

func TestBibliotecaDocumentoService_DeleteArquivoSoft(t *testing.T) {
	svc, catID := newBibliotecaTestService(t)
	ctx := context.Background()
	dto, err := svc.Upload(ctx, BibliotecaArquivoUploadInput{
		CategoriaID:  catID,
		OriginalName: "ok.pdf",
		DeclaredMIME: "application/pdf",
		Size:         4,
		UploadedBy:   uuid.New(),
	}, strings.NewReader("%PDF"))
	if err != nil {
		t.Fatal(err)
	}
	id, _ := uuid.Parse(dto.ID)
	if err := svc.DeleteArquivo(ctx, id); err != nil {
		t.Fatal(err)
	}
	_, _, err = svc.OpenDownload(ctx, id)
	if err == nil {
		t.Fatal("expected not found after delete")
	}
}

func TestBibliotecaDocumentoService_ListArquivosPreservesMetadata(t *testing.T) {
	svc, catID := newBibliotecaTestService(t)
	ctx := context.Background()
	uploaded, err := svc.Upload(ctx, BibliotecaArquivoUploadInput{
		CategoriaID:  catID,
		Titulo:       "Manual interno",
		OriginalName: "manual.pdf",
		DeclaredMIME: "application/pdf",
		Size:         4,
		UploadedBy:   uuid.New(),
	}, strings.NewReader("%PDF"))
	if err != nil {
		t.Fatal(err)
	}

	out, err := svc.ListArquivos(ctx, repository.BibliotecaArquivoListFilter{Page: 1, PageSize: 10})
	if err != nil {
		t.Fatal(err)
	}
	if len(out.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(out.Items))
	}
	item := out.Items[0]
	if item.ID != uploaded.ID {
		t.Fatalf("expected id %s, got %s", uploaded.ID, item.ID)
	}
	if item.Titulo != "Manual interno" || item.NomeArquivo != "manual.pdf" {
		t.Fatalf("unexpected metadata: %+v", item)
	}
	if item.TamanhoBytes <= 0 {
		t.Fatalf("list must return size: %+v", item)
	}
	if strings.HasPrefix(item.UploadedAt, "0001-") {
		t.Fatalf("uploaded_at must not be zero value: %s", item.UploadedAt)
	}
}

func TestBibliotecaDocumentoService_CreateCategoriaDuplicateNome(t *testing.T) {
	svc, _ := newBibliotecaTestService(t)
	ctx := context.Background()
	_, err := svc.CreateCategoria(ctx, CreateDocumentoCategoriaInput{Nome: "Políticas", Ativo: true})
	if err == nil {
		t.Fatal("expected conflict on duplicate nome")
	}
}

// silence io import if unused - actually used via strings.NewReader only
var _ io.Reader
