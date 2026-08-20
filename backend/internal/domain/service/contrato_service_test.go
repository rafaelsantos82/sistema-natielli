package service

import (
	"bytes"
	"context"
	"errors"
	"log/slog"
	"strings"
	"sync"
	"testing"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/infrastructure/storage"

	"github.com/google/uuid"
)

type memContratoRepo struct {
	mu              sync.Mutex
	contratos       map[uuid.UUID]*repository.ContratoRecord
	comps           map[string]*repository.CompartilhamentoRecord
	solicitacoes    map[uuid.UUID]*repository.SolicitacaoAssinaturaRecord
	signatarios     map[string]*repository.SignatarioRecord
	signBySol       map[uuid.UUID][]uuid.UUID
}

func newMemContratoRepo() *memContratoRepo {
	return &memContratoRepo{
		contratos:    make(map[uuid.UUID]*repository.ContratoRecord),
		comps:        make(map[string]*repository.CompartilhamentoRecord),
		solicitacoes: make(map[uuid.UUID]*repository.SolicitacaoAssinaturaRecord),
		signatarios:  make(map[string]*repository.SignatarioRecord),
		signBySol:    make(map[uuid.UUID][]uuid.UUID),
	}
}

func (m *memContratoRepo) List(_ context.Context, _, status string, _, _ int) ([]*repository.ContratoRecord, int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var out []*repository.ContratoRecord
	for _, c := range m.contratos {
		if c.DeletedAt != nil {
			continue
		}
		if status != "" && c.Status != status {
			continue
		}
		out = append(out, c)
	}
	return out, int64(len(out)), nil
}

func (m *memContratoRepo) GetByID(_ context.Context, id uuid.UUID) (*repository.ContratoRecord, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	c, ok := m.contratos[id]
	if !ok {
		return nil, nil
	}
	cp := *c
	return &cp, nil
}

func (m *memContratoRepo) Create(_ context.Context, rec *repository.ContratoRecord) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.contratos[rec.ID] = rec
	return nil
}

func (m *memContratoRepo) Update(_ context.Context, rec *repository.ContratoRecord) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.contratos[rec.ID] = rec
	return nil
}

func (m *memContratoRepo) SoftDelete(_ context.Context, id uuid.UUID, at time.Time) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if c, ok := m.contratos[id]; ok {
		c.DeletedAt = &at
	}
	return nil
}

func (m *memContratoRepo) CreateCompartilhamento(_ context.Context, rec *repository.CompartilhamentoRecord) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.comps[rec.Token] = rec
	return nil
}

func (m *memContratoRepo) FindCompartilhamentoByToken(_ context.Context, token string) (*repository.CompartilhamentoRecord, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	c, ok := m.comps[token]
	if !ok || time.Now().UTC().After(c.ExpiraEm) {
		return nil, nil
	}
	cp := *c
	return &cp, nil
}

func (m *memContratoRepo) RecordCompartilhamentoAcesso(context.Context, uuid.UUID, string) error {
	return nil
}

func (m *memContratoRepo) CreateSolicitacao(_ context.Context, rec *repository.SolicitacaoAssinaturaRecord) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.solicitacoes[rec.ID] = rec
	return nil
}

func (m *memContratoRepo) CreateSignatario(_ context.Context, rec *repository.SignatarioRecord) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.signatarios[rec.TokenAcesso] = rec
	m.signBySol[rec.SolicitacaoID] = append(m.signBySol[rec.SolicitacaoID], rec.ID)
	return nil
}

func (m *memContratoRepo) FindSignatarioByToken(_ context.Context, token string) (*repository.SignatarioRecord, *repository.ContratoRecord, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	sg, ok := m.signatarios[token]
	if !ok {
		return nil, nil, nil
	}
	if sg.ExpiraEm != nil && time.Now().UTC().After(*sg.ExpiraEm) {
		return nil, nil, nil
	}
	sol := m.solicitacoes[sg.SolicitacaoID]
	if sol == nil {
		return nil, nil, nil
	}
	c := m.contratos[sol.ContratoID]
	if c == nil {
		return nil, nil, nil
	}
	sgCopy := *sg
	cCopy := *c
	return &sgCopy, &cCopy, nil
}

func (m *memContratoRepo) UpdateSignatarioStatus(_ context.Context, id uuid.UUID, status string, assinadoEm time.Time, _ string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, sg := range m.signatarios {
		if sg.ID == id {
			sg.Status = status
			sg.AssinadoEm = &assinadoEm
			return nil
		}
	}
	return nil
}

func (m *memContratoRepo) CountSignatariosPendentes(_ context.Context, solicitacaoID uuid.UUID) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var n int64
	for _, id := range m.signBySol[solicitacaoID] {
		for _, sg := range m.signatarios {
			if sg.ID == id && sg.Status != "Assinado" {
				n++
			}
		}
	}
	return n, nil
}

func (m *memContratoRepo) GetSolicitacaoByContrato(_ context.Context, contratoID uuid.UUID) (*repository.SolicitacaoAssinaturaRecord, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, s := range m.solicitacoes {
		if s.ContratoID == contratoID {
			cp := *s
			return &cp, nil
		}
	}
	return nil, nil
}

func (m *memContratoRepo) UpdateContratoStatus(_ context.Context, id uuid.UUID, status string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if c, ok := m.contratos[id]; ok {
		c.Status = status
	}
	return nil
}

func testContratoService(t *testing.T) *ContratoService {
	t.Helper()
	dir := t.TempDir()
	store, err := storage.NewLocalStorage(dir)
	if err != nil {
		t.Fatal(err)
	}
	return NewContratoService(newMemContratoRepo(), store, ContratoUploadPolicy(), nil, slog.Default(), "https://app.test")
}

func createTestContrato(t *testing.T, svc *ContratoService, userID uuid.UUID, titulo string) *ContratoDTO {
	t.Helper()
	out, err := svc.CreateWithArquivo(context.Background(), ContratoInput{
		Titulo: titulo, Tipo: "Atendimento", CriadoPor: userID,
	}, ContratoArquivoUploadInput{
		OriginalName: "contrato.pdf", DeclaredMIME: "application/pdf", Size: 12,
	}, strings.NewReader("%PDF-1.4 test"))
	if err != nil {
		t.Fatal(err)
	}
	return out
}

func TestContratoService_CreateDefaultsRascunho(t *testing.T) {
	svc := testContratoService(t)
	userID := uuid.New()
	out, err := svc.CreateWithArquivo(context.Background(), ContratoInput{
		Titulo: "Contrato A", Tipo: "Atendimento", CriadoPor: userID,
	}, ContratoArquivoUploadInput{OriginalName: "a.pdf", DeclaredMIME: "application/pdf", Size: 4},
		bytes.NewReader([]byte("%PDF")))
	if err != nil {
		t.Fatal(err)
	}
	if out.Status != "Rascunho" {
		t.Fatalf("status=%s", out.Status)
	}
	if !out.TemArquivo {
		t.Fatal("expected arquivo")
	}
}

func TestContratoUploadPolicy_RejectsImage(t *testing.T) {
	p := ContratoUploadPolicy()
	if err := p.ValidateUpload("foto.jpg", "image/jpeg", 100); err == nil {
		t.Fatal("expected rejection")
	}
}

func TestContratoService_UpdateBlockedWhenAssinado(t *testing.T) {
	svc := testContratoService(t)
	userID := uuid.New()
	out := createTestContrato(t, svc, userID, "X")
	repo := svc.repo.(*memContratoRepo)
	repo.mu.Lock()
	repo.contratos[out.ID].Status = "Assinado"
	repo.mu.Unlock()

	_, err := svc.Update(context.Background(), out.ID, ContratoInput{
		Titulo: "Y", Tipo: "Outros", CriadoPor: userID,
	})
	if err == nil {
		t.Fatal("expected error")
	}
	var de *domainerrors.DomainError
	if !errors.As(err, &de) || de.Code != domainerrors.ErrorCodeBusinessRule {
		t.Fatalf("got %v", err)
	}
}

func TestContratoService_SoftDelete(t *testing.T) {
	svc := testContratoService(t)
	userID := uuid.New()
	out := createTestContrato(t, svc, userID, "Del")
	if err := svc.SoftDelete(context.Background(), out.ID); err != nil {
		t.Fatal(err)
	}
	_, err := svc.GetByID(context.Background(), out.ID)
	if err == nil {
		t.Fatal("expected not found")
	}
}

func TestContratoService_CompartilharBlockedRascunho(t *testing.T) {
	svc := testContratoService(t)
	userID := uuid.New()
	out := createTestContrato(t, svc, userID, "R")
	_, err := svc.Compartilhar(context.Background(), out.ID, CompartilharContratoInput{ExpiracaoHoras: 24, PodeVisualizar: true})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestContratoService_CompartilharAlwaysAllowsViewAndDownload(t *testing.T) {
	svc := testContratoService(t)
	userID := uuid.New()
	out := createTestContrato(t, svc, userID, "Share")
	repo := svc.repo.(*memContratoRepo)
	repo.mu.Lock()
	repo.contratos[out.ID].Status = "Aguardando Assinatura"
	repo.mu.Unlock()

	res, err := svc.Compartilhar(context.Background(), out.ID, CompartilharContratoInput{
		ExpiracaoHoras: 24, PodeVisualizar: false, PodeBaixar: false,
	})
	if err != nil {
		t.Fatal(err)
	}
	if res.Token == "" {
		t.Fatal("expected token")
	}
	repo.mu.Lock()
	var comp *repository.CompartilhamentoRecord
	for _, c := range repo.comps {
		if c.Token == res.Token {
			comp = c
			break
		}
	}
	repo.mu.Unlock()
	if comp == nil {
		t.Fatal("compartilhamento not found")
	}
	if !comp.PodeVisualizar || !comp.PodeBaixar {
		t.Fatalf("expected view+download true, got visualizar=%v baixar=%v", comp.PodeVisualizar, comp.PodeBaixar)
	}
}

func TestContratoService_FluxoAssinaturaCompleta(t *testing.T) {
	svc := testContratoService(t)
	userID := uuid.New()
	out := createTestContrato(t, svc, userID, "Assinatura")
	res, err := svc.SolicitarAssinatura(context.Background(), out.ID, SolicitarAssinaturaInput{
		Signatarios: []SignatarioInput{
			{Nome: "Maria", Email: "maria@test.com", Tipo: "Paciente", Ordem: 1},
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(res.Signatarios) != 1 {
		t.Fatalf("links=%d", len(res.Signatarios))
	}
	tok := res.Signatarios[0].Token
	pub, err := svc.GetAssinaturaPublic(context.Background(), tok)
	if err != nil || pub.JaAssinado {
		t.Fatalf("public: %v ja=%v", err, pub != nil && pub.JaAssinado)
	}
	if err := svc.AceitarAssinatura(context.Background(), tok, "", "127.0.0.1"); err != nil {
		t.Fatal(err)
	}
	got, _ := svc.GetByID(context.Background(), out.ID)
	if got.Status != "Assinado" {
		t.Fatalf("status=%s", got.Status)
	}
}
