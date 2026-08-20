package handlers

import (
	"bytes"
	"context"
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"
	"espaco-terapia-os/backend/internal/infrastructure/storage"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type contratoRepoStub struct {
	contratos map[uuid.UUID]*repository.ContratoRecord
}

func newContratoRepoStub() *contratoRepoStub {
	return &contratoRepoStub{contratos: make(map[uuid.UUID]*repository.ContratoRecord)}
}

func (s *contratoRepoStub) List(_ context.Context, _, _ string, _, _ int) ([]*repository.ContratoRecord, int64, error) {
	items := make([]*repository.ContratoRecord, 0, len(s.contratos))
	for _, c := range s.contratos {
		if c.DeletedAt == nil {
			items = append(items, c)
		}
	}
	return items, int64(len(items)), nil
}

func (s *contratoRepoStub) GetByID(_ context.Context, id uuid.UUID) (*repository.ContratoRecord, error) {
	c, ok := s.contratos[id]
	if !ok {
		return nil, nil
	}
	cp := *c
	return &cp, nil
}

func (s *contratoRepoStub) Create(_ context.Context, rec *repository.ContratoRecord) error {
	s.contratos[rec.ID] = rec
	return nil
}

func (s *contratoRepoStub) Update(_ context.Context, rec *repository.ContratoRecord) error {
	s.contratos[rec.ID] = rec
	return nil
}

func (s *contratoRepoStub) SoftDelete(_ context.Context, id uuid.UUID, at time.Time) error {
	if c, ok := s.contratos[id]; ok {
		c.DeletedAt = &at
	}
	return nil
}

func (s *contratoRepoStub) CreateCompartilhamento(context.Context, *repository.CompartilhamentoRecord) error {
	return nil
}
func (s *contratoRepoStub) FindCompartilhamentoByToken(context.Context, string) (*repository.CompartilhamentoRecord, error) {
	return nil, nil
}
func (s *contratoRepoStub) RecordCompartilhamentoAcesso(context.Context, uuid.UUID, string) error {
	return nil
}
func (s *contratoRepoStub) CreateSolicitacao(context.Context, *repository.SolicitacaoAssinaturaRecord) error {
	return nil
}
func (s *contratoRepoStub) CreateSignatario(context.Context, *repository.SignatarioRecord) error {
	return nil
}
func (s *contratoRepoStub) FindSignatarioByToken(context.Context, string) (*repository.SignatarioRecord, *repository.ContratoRecord, error) {
	return nil, nil, nil
}
func (s *contratoRepoStub) UpdateSignatarioStatus(context.Context, uuid.UUID, string, time.Time, string) error {
	return nil
}
func (s *contratoRepoStub) CountSignatariosPendentes(context.Context, uuid.UUID) (int64, error) {
	return 0, nil
}
func (s *contratoRepoStub) GetSolicitacaoByContrato(context.Context, uuid.UUID) (*repository.SolicitacaoAssinaturaRecord, error) {
	return nil, nil
}
func (s *contratoRepoStub) UpdateContratoStatus(_ context.Context, id uuid.UUID, status string) error {
	if c, ok := s.contratos[id]; ok {
		c.Status = status
	}
	return nil
}

func setupContratoHandler(t *testing.T) (*ContratoHandler, uuid.UUID) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	store, err := storage.NewLocalStorage(dir)
	if err != nil {
		t.Fatal(err)
	}
	svc := service.NewContratoService(newContratoRepoStub(), store, service.ContratoUploadPolicy(), nil, slog.Default(), "https://app.test")
	app := application.NewContratoApp(svc)
	eh := httplayer.NewErrorHandler(slog.Default())
	return NewContratoHandler(app, eh), uuid.New()
}

func TestContratoHandler_CreateMultipart(t *testing.T) {
	h, userID := setupContratoHandler(t)

	body := &bytes.Buffer{}
	w := multipart.NewWriter(body)
	_ = w.WriteField("titulo", "Contrato teste")
	_ = w.WriteField("tipo", "Atendimento")
	fw, _ := w.CreateFormFile("file", "doc.pdf")
	_, _ = io.WriteString(fw, "%PDF-1.4 test")
	_ = w.Close()

	r := gin.New()
	r.POST("/contratos", func(c *gin.Context) {
		c.Set("user_id", userID.String())
		h.Create(c)
	})
	req := httptest.NewRequest(http.MethodPost, "/contratos", body)
	req.Header.Set("Content-Type", w.FormDataContentType())
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"tem_arquivo":true`) && !strings.Contains(rec.Body.String(), `"tem_arquivo": true`) {
		t.Fatalf("expected tem_arquivo in response: %s", rec.Body.String())
	}
}

func TestContratoHandler_CreateRejectsJSON(t *testing.T) {
	h, userID := setupContratoHandler(t)

	r := gin.New()
	r.POST("/contratos", func(c *gin.Context) {
		c.Set("user_id", userID.String())
		h.Create(c)
	})
	req := httptest.NewRequest(http.MethodPost, "/contratos", strings.NewReader(`{"titulo":"x","tipo":"Atendimento"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d body=%s", rec.Code, rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), "Corpo da requisição inválido") {
		t.Fatalf("generic JSON error message on Create: %s", rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "multipart/form-data") {
		t.Fatalf("expected multipart hint: %s", rec.Body.String())
	}
}
