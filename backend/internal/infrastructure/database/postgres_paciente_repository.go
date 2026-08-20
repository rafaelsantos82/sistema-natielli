package database

import (
	"context"
	"errors"
	"strings"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresPacienteRepository struct {
	db *gorm.DB
}

func NewPostgresPacienteRepository(db *gorm.DB) *PostgresPacienteRepository {
	return &PostgresPacienteRepository{db: db}
}

func (r *PostgresPacienteRepository) Save(ctx context.Context, p *entity.Paciente) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		model, err := entityToModel(p)
		if err != nil {
			return err
		}
		if err := tx.Create(&model).Error; err != nil {
			return mapDBError(err)
		}
		return saveUnidadesTx(tx, p.ID, p.Unidades)
	})
}

func (r *PostgresPacienteRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.Paciente, error) {
	var model pacienteModel
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapDBError(err)
	}
	return modelToEntity(&model)
}

func (r *PostgresPacienteRepository) FindByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.Paciente, error) {
	var model pacienteModel
	err := r.db.WithContext(ctx).Unscoped().Where("id = ?", id).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapDBError(err)
	}
	return modelToEntity(&model)
}

func (r *PostgresPacienteRepository) Update(ctx context.Context, p *entity.Paciente) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		model, err := entityToModel(p)
		if err != nil {
			return err
		}
		if err := tx.Model(&pacienteModel{}).Where("id = ?", p.ID).Updates(&model).Error; err != nil {
			return mapDBError(err)
		}
		if err := tx.Where("paciente_id = ?", p.ID).Delete(&pacienteUnidadeModel{}).Error; err != nil {
			return mapDBError(err)
		}
		return saveUnidadesTx(tx, p.ID, p.Unidades)
	})
}

func (r *PostgresPacienteRepository) MarkDeleted(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		res := tx.Model(&pacienteModel{}).Where("id = ?", id).
			Update("status", string(entity.PacienteInativo))
		if res.Error != nil {
			return mapDBError(res.Error)
		}
		if res.RowsAffected == 0 {
			return domainerrors.NewNotFoundError("Paciente", id.String())
		}
		if err := tx.Where("id = ?", id).Delete(&pacienteModel{}).Error; err != nil {
			return mapDBError(err)
		}
		return nil
	})
}

func (r *PostgresPacienteRepository) Restore(ctx context.Context, id uuid.UUID) error {
	now := time.Now().UTC()
	res := r.db.WithContext(ctx).Unscoped().Model(&pacienteModel{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"deleted_at": nil,
			"status":     string(entity.PacienteAtivo),
			"updated_at": now,
		})
	if res.Error != nil {
		return mapDBError(res.Error)
	}
	if res.RowsAffected == 0 {
		return domainerrors.NewNotFoundError("Paciente", id.String())
	}
	return nil
}

func (r *PostgresPacienteRepository) ExistsCPF(ctx context.Context, cpf string, excludeID *uuid.UUID) (bool, error) {
	q := r.db.WithContext(ctx).Model(&pacienteModel{}).Where("cpf = ?", cpf)
	if excludeID != nil {
		q = q.Where("id <> ?", *excludeID)
	}
	var count int64
	if err := q.Count(&count).Error; err != nil {
		return false, mapDBError(err)
	}
	return count > 0, nil
}

func (r *PostgresPacienteRepository) List(ctx context.Context, filter repository.PacienteListFilter) ([]*entity.Paciente, int64, error) {
	q := r.db.WithContext(ctx).Model(&pacienteModel{})
	if filter.IncludeDeleted {
		q = q.Unscoped()
	}
	if filter.OnlyPacienteID != nil {
		q = q.Where("pacientes.id = ?", *filter.OnlyPacienteID)
	}
	if filter.TherapistProfissionalID != nil {
		pid := *filter.TherapistProfissionalID
		q = q.Where(`pacientes.id IN (
			SELECT paciente_id FROM paciente_profissionais WHERE profissional_id = ?
		)`, pid)
	}
	if len(filter.AllowedUnidadeIDs) > 0 {
		q = q.Joins("JOIN paciente_unidades pu_scope ON pu_scope.paciente_id = pacientes.id AND pu_scope.ativo = TRUE").
			Where("pu_scope.unidade_id IN ?", filter.AllowedUnidadeIDs)
	}
	if filter.UnidadeID != nil {
		q = q.Joins("JOIN paciente_unidades pu ON pu.paciente_id = pacientes.id AND pu.ativo = TRUE").
			Where("pu.unidade_id = ?", *filter.UnidadeID)
	}
	if filter.Status != "" {
		q = q.Where("pacientes.status = ?", filter.Status)
	}
	if filter.CPF != "" {
		q = q.Where("pacientes.cpf = ?", entity.NormalizeCPF(filter.CPF))
	}
	if filter.Query != "" {
		like := "%" + strings.TrimSpace(filter.Query) + "%"
		q = q.Where("pacientes.nome_completo ILIKE ?", like)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, mapDBError(err)
	}

	offset := (filter.Page - 1) * filter.PageSize
	if filter.TherapistProfissionalID != nil && filter.EnrichTherapistCarteira {
		return r.listTherapistCarteira(ctx, filter, q, total, offset)
	}

	order := "pacientes.nome_completo ASC"
	if filter.OrderByProximaConsulta && filter.TherapistProfissionalID != nil {
		order = "proxima_consulta_ordem ASC NULLS LAST, pacientes.nome_completo ASC"
	}

	var models []pacienteModel
	err := q.Order(order).
		Offset(offset).
		Limit(filter.PageSize).
		Find(&models).Error
	if err != nil {
		return nil, 0, mapDBError(err)
	}

	out := make([]*entity.Paciente, 0, len(models))
	for i := range models {
		p, err := modelToEntity(&models[i])
		if err != nil {
			return nil, 0, err
		}
		out = append(out, p)
	}
	return out, total, nil
}

type pacienteCarteiraRow struct {
	pacienteModel
	UltimaConsultaEm  *time.Time `gorm:"column:ultima_consulta_em"`
	ProximaConsultaEm *time.Time `gorm:"column:proxima_consulta_em"`
	TotalConsultas    int        `gorm:"column:total_consultas"`
}

func (r *PostgresPacienteRepository) listTherapistCarteira(
	ctx context.Context,
	filter repository.PacienteListFilter,
	base *gorm.DB,
	total int64,
	offset int,
) ([]*entity.Paciente, int64, error) {
	pid := *filter.TherapistProfissionalID
	sub := base.
		Select(`pacientes.*,
			stats.ultima_consulta_em,
			stats.proxima_consulta_em,
			stats.total_consultas,
			stats.proxima_consulta_ordem`).
		Joins(`INNER JOIN paciente_profissionais pp ON pp.paciente_id = pacientes.id AND pp.profissional_id = ?`, pid).
		Joins(`LEFT JOIN LATERAL (
			SELECT
				MAX(c.data_hora) FILTER (WHERE c.status = 'concluida') AS ultima_consulta_em,
				MIN(c.data_hora) FILTER (WHERE c.status IN ('agendada','confirmada') AND c.data_hora >= NOW()) AS proxima_consulta_em,
				COUNT(*) FILTER (WHERE c.status <> 'cancelada')::int AS total_consultas,
				MIN(c.data_hora) FILTER (WHERE c.status IN ('agendada','confirmada') AND c.data_hora >= NOW()) AS proxima_consulta_ordem
			FROM consultas c
			WHERE c.paciente_id = pacientes.id AND c.profissional_id = ?
		) stats ON true`, pid)

	order := "stats.proxima_consulta_ordem ASC NULLS LAST, pacientes.nome_completo ASC"
	if !filter.OrderByProximaConsulta {
		order = "pacientes.nome_completo ASC"
	}

	var rows []pacienteCarteiraRow
	if err := sub.Order(order).Offset(offset).Limit(filter.PageSize).Find(&rows).Error; err != nil {
		return nil, 0, mapDBError(err)
	}

	out := make([]*entity.Paciente, 0, len(rows))
	for i := range rows {
		p, err := modelToEntity(&rows[i].pacienteModel)
		if err != nil {
			return nil, 0, err
		}
		p.CarteiraStats = &entity.PacienteCarteiraStats{
			UltimaConsultaEm:  rows[i].UltimaConsultaEm,
			ProximaConsultaEm: rows[i].ProximaConsultaEm,
			TotalConsultas:    rows[i].TotalConsultas,
		}
		out = append(out, p)
	}
	return out, total, nil
}

func (r *PostgresPacienteRepository) SetUnidades(ctx context.Context, pacienteID uuid.UUID, unidades []entity.PacienteUnidadeLink) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("paciente_id = ?", pacienteID).Delete(&pacienteUnidadeModel{}).Error; err != nil {
			return mapDBError(err)
		}
		return saveUnidadesTx(tx, pacienteID, unidades)
	})
}

func (r *PostgresPacienteRepository) GetUnidades(ctx context.Context, pacienteID uuid.UUID) ([]entity.PacienteUnidadeLink, error) {
	var models []pacienteUnidadeModel
	if err := r.db.WithContext(ctx).Where("paciente_id = ?", pacienteID).Find(&models).Error; err != nil {
		return nil, mapDBError(err)
	}
	out := make([]entity.PacienteUnidadeLink, 0, len(models))
	for _, m := range models {
		out = append(out, entity.PacienteUnidadeLink{
			UnidadeID: m.UnidadeID,
			Principal: m.Principal,
			Ativo:     m.Ativo,
		})
	}
	return out, nil
}

func saveUnidadesTx(tx *gorm.DB, pacienteID uuid.UUID, unidades []entity.PacienteUnidadeLink) error {
	for _, u := range unidades {
		m := pacienteUnidadeModel{
			PacienteID: pacienteID,
			UnidadeID:  u.UnidadeID,
			Principal:  u.Principal,
			Ativo:      u.Ativo,
		}
		if err := tx.Create(&m).Error; err != nil {
			return mapDBError(err)
		}
	}
	return nil
}

func entityToModel(p *entity.Paciente) (*pacienteModel, error) {
	vacinas, err := marshalJSON(p.Vacinas)
	if err != nil {
		return nil, domainerrors.NewDatabaseError("falha ao serializar vacinas", err)
	}
	docs, err := marshalJSON(p.DocumentosAnexos)
	if err != nil {
		return nil, domainerrors.NewDatabaseError("falha ao serializar documentos", err)
	}
	if p.Vacinas == nil {
		vacinas = JSONB("[]")
	}
	if p.DocumentosAnexos == nil {
		docs = JSONB("[]")
	}
	return &pacienteModel{
		ID:                      p.ID,
		NomeCompleto:            p.NomeCompleto,
		NomeSocial:              p.NomeSocial,
		DataNascimento:          p.DataNascimento,
		SexoBiologico:           string(p.SexoBiologico),
		CPF:                     p.CPF,
		RGNumero:                p.RGNumero,
		RGOrgao:                 p.RGOrgao,
		Foto:                    p.Foto,
		TelPrincipal:            p.TelPrincipal,
		TelSecundario:           p.TelSecundario,
		Email:                   p.Email,
		Endereco:                p.Endereco,
		Numero:                  p.Numero,
		Complemento:             p.Complemento,
		Bairro:                  p.Bairro,
		Cidade:                  p.Cidade,
		UF:                      p.UF,
		CEP:                     p.CEP,
		ResponsavelNome:         p.ResponsavelNome,
		ResponsavelCPF:          p.ResponsavelCPF,
		ResponsavelParentesco:   p.ResponsavelParentesco,
		ResponsavelTel:          p.ResponsavelTel,
		ResponsavelEmail:        p.ResponsavelEmail,
		ContatoEmergenciaNome:   p.ContatoEmergenciaNome,
		ContatoEmergenciaTel:    p.ContatoEmergenciaTel,
		PessoasAutorizadasBusca: p.PessoasAutorizadasBusca,
		Escola:                  p.Escola,
		SerieAno:                p.SerieAno,
		NecessidadesEspeciais:   p.NecessidadesEspeciais,
		PediatraReferencia:      p.PediatraReferencia,
		Altura:                  p.Altura,
		Peso:                    p.Peso,
		TipoSanguineo:           p.TipoSanguineo,
		Alergias:                p.Alergias,
		DoencasCronicas:         p.DoencasCronicas,
		MedicacoesContinuo:      p.MedicacoesContinuo,
		CirurgiasPrevias:        p.CirurgiasPrevias,
		HistoricoFamiliar:       p.HistoricoFamiliar,
		Vacinas:                 vacinas,
		Observacoes:             p.Observacoes,
		AtividadeFisicaFreq:     p.AtividadeFisicaFreq,
		AtividadeFisicaTipo:     p.AtividadeFisicaTipo,
		Alimentacao:             p.Alimentacao,
		SonoHoras:               p.SonoHoras,
		ProfissionalResponsavel: p.ProfissionalResponsavel,
		Status:                  string(p.Status),
		ConsentimentoLGPD:       p.ConsentimentoLGPD,
		AutorizacaoUsoImagem:    p.AutorizacaoUsoImagem,
		AssinaturaDigital:       p.AssinaturaDigital,
		DocumentosAnexos:        docs,
		CreatedAt:               p.CreatedAt,
		UpdatedAt:               p.UpdatedAt,
	}, nil
}

func modelToEntity(m *pacienteModel) (*entity.Paciente, error) {
	var vacinas []entity.Vacina
	if err := unmarshalJSON(m.Vacinas, &vacinas); err != nil {
		return nil, domainerrors.NewDatabaseError("falha ao ler vacinas", err)
	}
	var docs []entity.DocumentoAnexo
	if err := unmarshalJSON(m.DocumentosAnexos, &docs); err != nil {
		return nil, domainerrors.NewDatabaseError("falha ao ler documentos", err)
	}
	var deletedAt *time.Time
	if m.DeletedAt.Valid {
		t := m.DeletedAt.Time
		deletedAt = &t
	}
	return &entity.Paciente{
		ID:                      m.ID,
		NomeCompleto:            m.NomeCompleto,
		NomeSocial:              m.NomeSocial,
		DataNascimento:          m.DataNascimento,
		SexoBiologico:           entity.SexoBiologico(m.SexoBiologico),
		CPF:                     m.CPF,
		RGNumero:                m.RGNumero,
		RGOrgao:                 m.RGOrgao,
		Foto:                    m.Foto,
		TelPrincipal:            m.TelPrincipal,
		TelSecundario:           m.TelSecundario,
		Email:                   m.Email,
		Endereco:                m.Endereco,
		Numero:                  m.Numero,
		Complemento:             m.Complemento,
		Bairro:                  m.Bairro,
		Cidade:                  m.Cidade,
		UF:                      m.UF,
		CEP:                     m.CEP,
		ResponsavelNome:         m.ResponsavelNome,
		ResponsavelCPF:          m.ResponsavelCPF,
		ResponsavelParentesco:   m.ResponsavelParentesco,
		ResponsavelTel:          m.ResponsavelTel,
		ResponsavelEmail:        m.ResponsavelEmail,
		ContatoEmergenciaNome:   m.ContatoEmergenciaNome,
		ContatoEmergenciaTel:    m.ContatoEmergenciaTel,
		PessoasAutorizadasBusca: m.PessoasAutorizadasBusca,
		Escola:                  m.Escola,
		SerieAno:                m.SerieAno,
		NecessidadesEspeciais:   m.NecessidadesEspeciais,
		PediatraReferencia:      m.PediatraReferencia,
		Altura:                  m.Altura,
		Peso:                    m.Peso,
		TipoSanguineo:           m.TipoSanguineo,
		Alergias:                m.Alergias,
		DoencasCronicas:         m.DoencasCronicas,
		MedicacoesContinuo:      m.MedicacoesContinuo,
		CirurgiasPrevias:        m.CirurgiasPrevias,
		HistoricoFamiliar:       m.HistoricoFamiliar,
		Vacinas:                 vacinas,
		Observacoes:             m.Observacoes,
		AtividadeFisicaFreq:     m.AtividadeFisicaFreq,
		AtividadeFisicaTipo:     m.AtividadeFisicaTipo,
		Alimentacao:             m.Alimentacao,
		SonoHoras:               m.SonoHoras,
		ProfissionalResponsavel: m.ProfissionalResponsavel,
		Status:                  entity.PacienteStatus(m.Status),
		ConsentimentoLGPD:       m.ConsentimentoLGPD,
		AutorizacaoUsoImagem:    m.AutorizacaoUsoImagem,
		AssinaturaDigital:       m.AssinaturaDigital,
		DocumentosAnexos:        docs,
		CreatedAt:               m.CreatedAt,
		UpdatedAt:               m.UpdatedAt,
		DeletedAt:               deletedAt,
	}, nil
}

func mapDBError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return domainerrors.NewNotFoundError("Paciente", "")
	}
	return MapDBError(err)
}
