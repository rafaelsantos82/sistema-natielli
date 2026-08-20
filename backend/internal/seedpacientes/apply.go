package seedpacientes

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	infradb "espaco-terapia-os/backend/internal/infrastructure/database"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type existingPaciente struct {
	ID           uuid.UUID `gorm:"column:id"`
	CPF          *string   `gorm:"column:cpf"`
	TelPrincipal string    `gorm:"column:tel_principal"`
	NomeCompleto string    `gorm:"column:nome_completo"`
}

func (existingPaciente) TableName() string { return "pacientes" }

type LookupIndex struct {
	ByCPF map[string]uuid.UUID
	ByTel map[string]uuid.UUID
}

func LoadLookup(ctx context.Context, db *gorm.DB) (LookupIndex, error) {
	var rows []existingPaciente
	if err := db.WithContext(ctx).Where("deleted_at IS NULL").Find(&rows).Error; err != nil {
		return LookupIndex{}, err
	}
	idx := LookupIndex{
		ByCPF: make(map[string]uuid.UUID, len(rows)),
		ByTel: make(map[string]uuid.UUID, len(rows)),
	}
	for _, r := range rows {
		if r.CPF != nil && strings.TrimSpace(*r.CPF) != "" {
			idx.ByCPF[entity.NormalizeCPF(*r.CPF)] = r.ID
		}
		tel := digits(r.TelPrincipal)
		if tel != "" {
			idx.ByTel[tel] = r.ID
		}
	}
	return idx, nil
}

func (idx LookupIndex) Match(id Identity) (uuid.UUID, bool) {
	if id.CPF != nil {
		if uid, ok := idx.ByCPF[entity.NormalizeCPF(*id.CPF)]; ok {
			return uid, true
		}
	}
	if id.TelDigits != "" {
		if uid, ok := idx.ByTel[id.TelDigits]; ok {
			return uid, true
		}
	}
	return uuid.Nil, false
}

func ApplyCadastro(ctx context.Context, db *gorm.DB, records []UnifiedRecord, dryRun bool) (ApplyReport, error) {
	idx, err := LoadLookup(ctx, db)
	if err != nil {
		return ApplyReport{}, err
	}
	repo := infradb.NewPostgresPacienteRepository(db)
	rep := ApplyReport{}

	for _, u := range records {
		cad := MapCadastro(u)
		if cad.NomeCompleto == "" || cad.TelPrincipal == "" {
			rep.Invalid++
			rep.Issues = append(rep.Issues, fmt.Sprintf("linha sem nome/telefone: %s", redactName(cad.NomeCompleto)))
			continue
		}
		ident := Identity{NomeCompleto: cad.NomeCompleto, TelDigits: cad.TelPrincipal, CPF: cad.CPF}
		if _, ok := idx.Match(ident); ok {
			rep.Skipped++
			continue
		}
		if dryRun {
			rep.Created++
			continue
		}
		p, err := cadastroToEntity(cad)
		if err != nil {
			rep.Invalid++
			rep.Issues = append(rep.Issues, fmt.Sprintf("%s: %v", redactName(cad.NomeCompleto), err))
			continue
		}
		if err := repo.Save(ctx, p); err != nil {
			rep.Invalid++
			rep.Issues = append(rep.Issues, fmt.Sprintf("%s: save: %v", redactName(cad.NomeCompleto), err))
			continue
		}
		if cad.DataCadastro != nil {
			if err := db.WithContext(ctx).Exec(
				`UPDATE pacientes SET data_cadastro = ? WHERE id = ?`,
				*cad.DataCadastro, p.ID,
			).Error; err != nil {
				rep.Issues = append(rep.Issues, fmt.Sprintf("%s: data_cadastro: %v", redactName(cad.NomeCompleto), err))
			}
		}
		idx.ByTel[cad.TelPrincipal] = p.ID
		if cad.CPF != nil {
			idx.ByCPF[*cad.CPF] = p.ID
		}
		rep.Created++
	}
	return rep, nil
}

func cadastroToEntity(cad Cadastro) (*entity.Paciente, error) {
	now := time.Now().UTC()
	p := &entity.Paciente{
		ID:                uuid.New(),
		NomeCompleto:      cad.NomeCompleto,
		NomeSocial:        cad.NomeSocial,
		DataNascimento:    cad.DataNascimento,
		SexoBiologico:     entity.SexoNaoInformado,
		CPF:               cad.CPF,
		TelPrincipal:      cad.TelPrincipal,
		Email:             cad.Email,
		Cidade:            cad.Cidade,
		UF:                cad.UF,
		CEP:               cad.CEP,
		ResponsavelNome:   cad.ResponsavelNome,
		Observacoes:       ptrNonEmpty(cad.Observacoes),
		Status:            entity.PacienteStatus(cad.Status),
		ConsentimentoLGPD: false,
		Unidades: []entity.PacienteUnidadeLink{
			{UnidadeID: cad.UnidadeID, Principal: true, Ativo: true},
		},
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := p.ValidateOpts(entity.ValidateOpts{RequireLGPD: false, AllowEmptyCPF: true}); err != nil {
		return nil, err
	}
	return p, nil
}

func WritePendencias(path string, file PendenciasFile) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o750); err != nil {
		return err
	}
	data, err := json.MarshalIndent(file, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o600)
}

func LoadPendencias(path string) (PendenciasFile, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return PendenciasFile{}, err
	}
	var file PendenciasFile
	if err := json.Unmarshal(raw, &file); err != nil {
		return PendenciasFile{}, err
	}
	if file.SchemaVersion != 0 && file.SchemaVersion != SchemaVersion {
		return PendenciasFile{}, fmt.Errorf("schema_version %d não suportado (esperado %d)", file.SchemaVersion, SchemaVersion)
	}
	return file, nil
}

func redactName(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "(sem nome)"
	}
	parts := strings.Fields(name)
	if len(parts) == 1 {
		return parts[0]
	}
	return parts[0] + " " + string([]rune(parts[len(parts)-1])[:1]) + "."
}
