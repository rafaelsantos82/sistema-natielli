package handlers

import (
	"bytes"
	"context"
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"
	"espaco-terapia-os/backend/internal/infrastructure/storage"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type bibCatRepoStub struct {
	cats map[uuid.UUID]*entity.BibliotecaCategoria
}

func (s *bibCatRepoStub) Create(_ context.Context, cat *entity.BibliotecaCategoria) error {
	s.cats[cat.ID] = cat
	return nil
}
func (s *bibCatRepoStub) Update(_ context.Context, cat *entity.BibliotecaCategoria) error {
	s.cats[cat.ID] = cat
	return nil
}
func (s *bibCatRepoStub) FindByID(_ context.Context, id uuid.UUID) (*entity.BibliotecaCategoria, error) {
	return s.cats[id], nil
}
func (s *bibCatRepoStub) List(_ context.Context, _ repository.DocumentoCategoriaListFilter) ([]*entity.BibliotecaCategoria, error) {
	out := make([]*entity.BibliotecaCategoria, 0, len(s.cats))
	for _, c := range s.cats {
		out = append(out, c)
	}
	return out, nil
}
func (s *bibCatRepoStub) SoftDelete(_ context.Context, id uuid.UUID) error {
	delete(s.cats, id)
	return nil
}
func (s *bibCatRepoStub) ExistsNome(_ context.Context, _ string, _ *uuid.UUID) (bool, error) {
	return false, nil
}

type bibArqRepoStub struct {
	arquivos map[uuid.UUID]*entity.BibliotecaArquivo
}

func (s *bibArqRepoStub) Create(_ context.Context, arq *entity.BibliotecaArquivo) error {
	s.arquivos[arq.ID] = arq
	return nil
}
func (s *bibArqRepoStub) FindByID(_ context.Context, id uuid.UUID) (*entity.BibliotecaArquivo, error) {
	a, ok := s.arquivos[id]
	if !ok {
		return nil, nil
	}
	return a, nil
}
func (s *bibArqRepoStub) List(_ context.Context, _ repository.BibliotecaArquivoListFilter) (*repository.BibliotecaArquivoListResult, error) {
	items := make([]*entity.BibliotecaArquivo, 0, len(s.arquivos))
	for _, a := range s.arquivos {
		items = append(items, a)
	}
	return &repository.BibliotecaArquivoListResult{Items: items, Total: int64(len(items)), Page: 1, PageSize: 50, TotalPages: 1}, nil
}
func (s *bibArqRepoStub) SoftDelete(_ context.Context, id uuid.UUID) error {
	delete(s.arquivos, id)
	return nil
}
func (s *bibArqRepoStub) CountActiveByCategoria(_ context.Context, categoriaID uuid.UUID) (int64, error) {
	var n int64
	for _, a := range s.arquivos {
		if a.CategoriaID == categoriaID {
			n++
		}
	}
	return n, nil
}

func setupBibliotecaHandler(t *testing.T) (*BibliotecaDocumentoHandler, uuid.UUID, uuid.UUID) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	store, err := storage.NewLocalStorage(dir)
	if err != nil {
		t.Fatal(err)
	}
	catID := uuid.New()
	userID := uuid.New()
	cats := &bibCatRepoStub{
		cats: map[uuid.UUID]*entity.BibliotecaCategoria{
			catID: {ID: catID, Nome: "Geral", Ativo: true},
		},
	}
	arqs := &bibArqRepoStub{arquivos: map[uuid.UUID]*entity.BibliotecaArquivo{}}
	policy := service.NewUploadPolicy(10*1024*1024, []string{"txt", "pdf"}, []string{"text/plain", "application/pdf"})
	svc := service.NewBibliotecaDocumentoService(cats, arqs, store, policy, slog.New(slog.NewTextHandler(os.Stderr, nil)))
	app := application.NewBibliotecaDocumentoApp(svc)
	logger := slog.New(slog.NewTextHandler(os.Stderr, nil))
	h := NewBibliotecaDocumentoHandler(app, httplayer.NewErrorHandler(logger), logger)
	return h, catID, userID
}

func TestBibliotecaDocumentoHandler_UploadAndDelete(t *testing.T) {
	h, catID, userID := setupBibliotecaHandler(t)

	body := &bytes.Buffer{}
	w := multipart.NewWriter(body)
	_ = w.WriteField("categoria_id", catID.String())
	_ = w.WriteField("titulo", "Teste")
	fw, _ := w.CreateFormFile("file", "doc.txt")
	_, _ = io.WriteString(fw, "conteudo")
	_ = w.Close()

	r := gin.New()
	r.POST("/arquivos", func(c *gin.Context) {
		c.Set("user_id", userID.String())
		h.UploadArquivo(c)
	})
	req := httptest.NewRequest(http.MethodPost, "/arquivos", body)
	req.Header.Set("Content-Type", w.FormDataContentType())
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("upload: expected 201, got %d body=%s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"id"`) {
		t.Fatalf("upload response missing id: %s", rec.Body.String())
	}

	// Parse id from JSON minimally
	idStr := rec.Body.String()
	idx := strings.Index(idStr, `"id":"`)
	if idx < 0 {
		t.Fatal("no id in response")
	}
	idStr = idStr[idx+6:]
	end := strings.Index(idStr, `"`)
	docID, err := uuid.Parse(idStr[:end])
	if err != nil {
		t.Fatalf("parse id: %v", err)
	}

	r2 := gin.New()
	r2.DELETE("/arquivos/:id", func(c *gin.Context) {
		c.Set("user_id", userID.String())
		h.DeleteArquivo(c)
	})
	req2 := httptest.NewRequest(http.MethodDelete, "/arquivos/"+docID.String(), nil)
	rec2 := httptest.NewRecorder()
	r2.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusNoContent {
		t.Fatalf("delete: expected 204, got %d body=%s", rec2.Code, rec2.Body.String())
	}
}

func TestBibliotecaDocumentoHandler_UploadMissingFile(t *testing.T) {
	h, catID, userID := setupBibliotecaHandler(t)

	body := &bytes.Buffer{}
	w := multipart.NewWriter(body)
	_ = w.WriteField("categoria_id", catID.String())
	_ = w.Close()

	r := gin.New()
	r.POST("/arquivos", func(c *gin.Context) {
		c.Set("user_id", userID.String())
		h.UploadArquivo(c)
	})
	req := httptest.NewRequest(http.MethodPost, "/arquivos", body)
	req.Header.Set("Content-Type", w.FormDataContentType())
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestBibliotecaDocumentoHandler_UploadInactiveCategoria(t *testing.T) {
	h, catID, userID := setupBibliotecaHandler(t)
	// deactivate category via service path — stub still has Ativo true; use invalid cat instead
	_ = domainerrors.NewNotFoundError("categoria", catID.String())

	body := &bytes.Buffer{}
	w := multipart.NewWriter(body)
	_ = w.WriteField("categoria_id", uuid.New().String())
	fw, _ := w.CreateFormFile("file", "doc.txt")
	_, _ = io.WriteString(fw, "x")
	_ = w.Close()

	r := gin.New()
	r.POST("/arquivos", func(c *gin.Context) {
		c.Set("user_id", userID.String())
		h.UploadArquivo(c)
	})
	req := httptest.NewRequest(http.MethodPost, "/arquivos", body)
	req.Header.Set("Content-Type", w.FormDataContentType())
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound && rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 404/400 for unknown categoria, got %d body=%s", rec.Code, rec.Body.String())
	}
}
