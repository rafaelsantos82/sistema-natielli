package service

import (
	"context"
	"testing"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
)

type pacienteProfRepoStub struct {
	links []repository.PacienteProfissionalLink
}

func (s *pacienteProfRepoStub) Upsert(_ context.Context, link repository.PacienteProfissionalLink) error {
	for i, l := range s.links {
		if l.PacienteID == link.PacienteID && l.ProfissionalID == link.ProfissionalID {
			if link.Origem == repository.PacienteProfissionalOrigemConsultaRealizada {
				s.links[i].Origem = link.Origem
			}
			return nil
		}
	}
	s.links = append(s.links, link)
	return nil
}

func (s *pacienteProfRepoStub) Exists(_ context.Context, pacienteID, profissionalID uuid.UUID) (bool, error) {
	for _, l := range s.links {
		if l.PacienteID == pacienteID && l.ProfissionalID == profissionalID {
			return true, nil
		}
	}
	return false, nil
}

func TestPacienteProfissionalService_LinkAgendada_SkipsCancelled(t *testing.T) {
	repo := &pacienteProfRepoStub{}
	svc := NewPacienteProfissionalService(repo, nil)
	c := &entity.Consulta{
		ID:             uuid.New(),
		PacienteID:     uuid.New(),
		ProfissionalID: uuid.New(),
		Status:         entity.ConsultaCancelada,
		DataHora:       time.Now(),
	}
	if err := svc.LinkAgendada(context.Background(), c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(repo.links) != 0 {
		t.Fatalf("expected no link for cancelled consulta")
	}
}

func TestPacienteProfissionalService_LinkRealizada_UpgradesOrigem(t *testing.T) {
	repo := &pacienteProfRepoStub{}
	svc := NewPacienteProfissionalService(repo, nil)
	pid, profID := uuid.New(), uuid.New()
	c := &entity.Consulta{
		ID:             uuid.New(),
		PacienteID:     pid,
		ProfissionalID: profID,
		Status:         entity.ConsultaAgendada,
		DataHora:       time.Now(),
	}
	if err := svc.LinkAgendada(context.Background(), c); err != nil {
		t.Fatal(err)
	}
	c.Status = entity.ConsultaConcluida
	if err := svc.LinkRealizada(context.Background(), c); err != nil {
		t.Fatal(err)
	}
	if len(repo.links) != 1 {
		t.Fatalf("expected 1 link, got %d", len(repo.links))
	}
	if repo.links[0].Origem != repository.PacienteProfissionalOrigemConsultaRealizada {
		t.Fatalf("expected consulta_realizada, got %s", repo.links[0].Origem)
	}
}
