package service

import (
	"testing"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
)

func strPtr(s string) *string { return &s }

func TestProfissionalAtendeNoDia(t *testing.T) {
	p := &entity.Profissional{
		DiasAtendimento: []string{"seg", "ter", "qua", "qui", "sex"},
	}
	loc, _ := time.LoadLocation("America/Sao_Paulo")
	terca := time.Date(2026, 6, 2, 10, 0, 0, 0, loc)
	domingo := time.Date(2026, 6, 7, 10, 0, 0, 0, loc)

	if !profissionalAtendeNoDia(p, terca) {
		t.Fatal("expected tuesday attendance")
	}
	if profissionalAtendeNoDia(p, domingo) {
		t.Fatal("expected no sunday attendance")
	}
}

func TestProfissionalDentroDoExpediente(t *testing.T) {
	p := &entity.Profissional{
		HorarioInicio: strPtr("08:00"),
		HorarioFim:    strPtr("18:00"),
	}
	loc, _ := time.LoadLocation("America/Sao_Paulo")
	start := time.Date(2026, 6, 2, 10, 0, 0, 0, loc)
	end := time.Date(2026, 6, 2, 11, 0, 0, 0, loc)
	early := time.Date(2026, 6, 2, 7, 0, 0, 0, loc)

	if !profissionalDentroDoExpediente(p, start, end) {
		t.Fatal("expected inside hours")
	}
	if profissionalDentroDoExpediente(p, early, start) {
		t.Fatal("expected outside hours")
	}
}
