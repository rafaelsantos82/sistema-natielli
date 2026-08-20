package database

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresProfissionalRepository struct {
	db *gorm.DB
}

func NewPostgresProfissionalRepository(db *gorm.DB) *PostgresProfissionalRepository {
	return &PostgresProfissionalRepository{db: db}
}

func (r *PostgresProfissionalRepository) Save(ctx context.Context, p *entity.Profissional) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		model, err := profissionalEntityToModel(p)
		if err != nil {
			return err
		}
		if err := tx.Create(&model).Error; err != nil {
			return mapProfissionalDBError(err)
		}
		if err := saveProfUnidadesTx(tx, p.ID, p.UnidadeIDs); err != nil {
			return err
		}
		return saveProfEspecialidadesTx(tx, p.ID, p.Especialidades)
	})
}

func (r *PostgresProfissionalRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.Profissional, error) {
	var model profissionalModel
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapProfissionalDBError(err)
	}
	return profissionalModelToEntity(&model)
}

func (r *PostgresProfissionalRepository) FindByIDUnscoped(ctx context.Context, id uuid.UUID) (*entity.Profissional, error) {
	var model profissionalModel
	err := r.db.WithContext(ctx).Unscoped().Where("id = ?", id).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapProfissionalDBError(err)
	}
	return profissionalModelToEntity(&model)
}

func (r *PostgresProfissionalRepository) Update(ctx context.Context, p *entity.Profissional) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		model, err := profissionalEntityToModel(p)
		if err != nil {
			return err
		}
		if err := tx.Model(&profissionalModel{}).Where("id = ?", p.ID).Updates(&model).Error; err != nil {
			return mapProfissionalDBError(err)
		}
		if err := tx.Where("profissional_id = ?", p.ID).Delete(&profissionalUnidadeModel{}).Error; err != nil {
			return mapProfissionalDBError(err)
		}
		if err := saveProfUnidadesTx(tx, p.ID, p.UnidadeIDs); err != nil {
			return err
		}
		if err := tx.Where("profissional_id = ?", p.ID).Delete(&profissionalEspecialidadeModel{}).Error; err != nil {
			return mapProfissionalDBError(err)
		}
		return saveProfEspecialidadesTx(tx, p.ID, p.Especialidades)
	})
}

func (r *PostgresProfissionalRepository) MarkDeleted(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		res := tx.Model(&profissionalModel{}).Where("id = ?", id).
			Update("status", string(entity.ProfissionalInativo))
		if res.Error != nil {
			return mapProfissionalDBError(res.Error)
		}
		if res.RowsAffected == 0 {
			return domainerrors.NewNotFoundError("Profissional", id.String())
		}
		if err := tx.Where("id = ?", id).Delete(&profissionalModel{}).Error; err != nil {
			return mapProfissionalDBError(err)
		}
		return nil
	})
}

func (r *PostgresProfissionalRepository) Restore(ctx context.Context, id uuid.UUID) error {
	now := time.Now().UTC()
	res := r.db.WithContext(ctx).Unscoped().Model(&profissionalModel{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"deleted_at": nil,
			"status":     string(entity.ProfissionalAtivo),
			"updated_at": now,
		})
	if res.Error != nil {
		return mapProfissionalDBError(res.Error)
	}
	if res.RowsAffected == 0 {
		return domainerrors.NewNotFoundError("Profissional", id.String())
	}
	return nil
}

func (r *PostgresProfissionalRepository) ExistsEmail(ctx context.Context, email string, excludeID *uuid.UUID) (bool, error) {
	q := r.db.WithContext(ctx).Model(&profissionalModel{}).Where("LOWER(email) = LOWER(?)", email)
	if excludeID != nil {
		q = q.Where("id <> ?", *excludeID)
	}
	var count int64
	if err := q.Count(&count).Error; err != nil {
		return false, mapProfissionalDBError(err)
	}
	return count > 0, nil
}

func (r *PostgresProfissionalRepository) List(ctx context.Context, filter repository.ProfissionalListFilter) ([]*entity.Profissional, int64, error) {
	q := r.db.WithContext(ctx).Model(&profissionalModel{})
	if filter.IncludeDeleted {
		q = q.Unscoped()
	}
	if filter.UnidadeID != nil {
		q = q.Joins("JOIN profissional_unidades pu ON pu.profissional_id = profissionais.id").
			Where("pu.unidade_id = ?", *filter.UnidadeID)
	}
	if filter.Status != "" {
		q = q.Where("profissionais.status = ?", filter.Status)
	}
	if filter.Query != "" {
		like := "%" + strings.TrimSpace(filter.Query) + "%"
		q = q.Where("profissionais.nome ILIKE ? OR profissionais.email ILIKE ?", like, like)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, mapProfissionalDBError(err)
	}

	offset := (filter.Page - 1) * filter.PageSize
	var models []profissionalModel
	err := q.Order("profissionais.nome ASC").Offset(offset).Limit(filter.PageSize).Find(&models).Error
	if err != nil {
		return nil, 0, mapProfissionalDBError(err)
	}

	out := make([]*entity.Profissional, 0, len(models))
	for i := range models {
		p, err := profissionalModelToEntity(&models[i])
		if err != nil {
			return nil, 0, err
		}
		out = append(out, p)
	}
	return out, total, nil
}

func (r *PostgresProfissionalRepository) GetUnidadeIDs(ctx context.Context, profissionalID uuid.UUID) ([]uuid.UUID, error) {
	var models []profissionalUnidadeModel
	if err := r.db.WithContext(ctx).Where("profissional_id = ?", profissionalID).Find(&models).Error; err != nil {
		return nil, mapProfissionalDBError(err)
	}
	out := make([]uuid.UUID, 0, len(models))
	for _, m := range models {
		out = append(out, m.UnidadeID)
	}
	return out, nil
}

func (r *PostgresProfissionalRepository) GetEspecialidades(ctx context.Context, profissionalID uuid.UUID) ([]string, error) {
	var models []profissionalEspecialidadeModel
	if err := r.db.WithContext(ctx).Where("profissional_id = ?", profissionalID).Find(&models).Error; err != nil {
		return nil, mapProfissionalDBError(err)
	}
	out := make([]string, 0, len(models))
	for _, m := range models {
		out = append(out, m.Especialidade)
	}
	return out, nil
}

func (r *PostgresProfissionalRepository) ListConselhos(ctx context.Context, profissionalID uuid.UUID) ([]*entity.ProfissionalConselho, error) {
	var models []profissionalConselhoModel
	if err := r.db.WithContext(ctx).Where("profissional_id = ?", profissionalID).Order("principal DESC, created_at ASC").Find(&models).Error; err != nil {
		return nil, mapProfissionalDBError(err)
	}
	out := make([]*entity.ProfissionalConselho, 0, len(models))
	for i := range models {
		out = append(out, profissionalConselhoModelToEntity(&models[i]))
	}
	return out, nil
}

func (r *PostgresProfissionalRepository) FindConselhoByID(ctx context.Context, profissionalID, conselhoID uuid.UUID) (*entity.ProfissionalConselho, error) {
	var model profissionalConselhoModel
	err := r.db.WithContext(ctx).Where("id = ? AND profissional_id = ?", conselhoID, profissionalID).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapProfissionalDBError(err)
	}
	return profissionalConselhoModelToEntity(&model), nil
}

func (r *PostgresProfissionalRepository) SaveConselho(ctx context.Context, c *entity.ProfissionalConselho) error {
	model := profissionalConselhoEntityToModel(c)
	if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
		return mapProfissionalDBError(err)
	}
	return nil
}

func (r *PostgresProfissionalRepository) UpdateConselho(ctx context.Context, c *entity.ProfissionalConselho) error {
	model := profissionalConselhoEntityToModel(c)
	if err := r.db.WithContext(ctx).Model(&profissionalConselhoModel{}).Where("id = ?", c.ID).Updates(&model).Error; err != nil {
		return mapProfissionalDBError(err)
	}
	return nil
}

func (r *PostgresProfissionalRepository) SoftDeleteConselho(ctx context.Context, profissionalID, conselhoID uuid.UUID) error {
	err := r.db.WithContext(ctx).Where("id = ? AND profissional_id = ?", conselhoID, profissionalID).Delete(&profissionalConselhoModel{}).Error
	return mapProfissionalDBError(err)
}

func saveProfUnidadesTx(tx *gorm.DB, profID uuid.UUID, unidadeIDs []uuid.UUID) error {
	for _, uid := range unidadeIDs {
		m := profissionalUnidadeModel{ProfissionalID: profID, UnidadeID: uid}
		if err := tx.Create(&m).Error; err != nil {
			return mapProfissionalDBError(err)
		}
	}
	return nil
}

func saveProfEspecialidadesTx(tx *gorm.DB, profID uuid.UUID, especialidades []string) error {
	for _, esp := range especialidades {
		esp = strings.TrimSpace(esp)
		if esp == "" {
			continue
		}
		m := profissionalEspecialidadeModel{
			ID:             uuid.New(),
			ProfissionalID: profID,
			Especialidade:  esp,
		}
		if err := tx.Create(&m).Error; err != nil {
			return mapProfissionalDBError(err)
		}
	}
	return nil
}

func profissionalEntityToModel(p *entity.Profissional) (*profissionalModel, error) {
	janelas, err := marshalJSON(p.JanelasHorarias)
	if err != nil {
		return nil, domainerrors.NewDatabaseError("falha ao serializar janelas_horarias", err)
	}
	if p.JanelasHorarias == nil {
		janelas = JSONB("[]")
	}
	dados, err := marshalJSON(p.DadosComplementares)
	if err != nil {
		return nil, domainerrors.NewDatabaseError("falha ao serializar dados_complementares", err)
	}
	if p.DadosComplementares == nil {
		dados = JSONB("{}")
	}
	var conselho *string
	if p.Conselho != nil {
		s := string(*p.Conselho)
		conselho = &s
	}
	return &profissionalModel{
		ID:                     p.ID,
		Nome:                   p.Nome,
		CPF:                    p.CPF,
		RG:                     p.RG,
		DataNascimento:         p.DataNascimento,
		Email:                  p.Email,
		Telefone:               p.Telefone,
		Celular:                p.Celular,
		Conselho:               conselho,
		NumeroRegistro:         p.NumeroRegistro,
		UFRegistro:             p.UFRegistro,
		Foto:                   p.Foto,
		CEP:                    p.CEP,
		Logradouro:             p.Logradouro,
		Numero:                 p.Numero,
		Complemento:            p.Complemento,
		Bairro:                 p.Bairro,
		Cidade:                 p.Cidade,
		UF:                     p.UF,
		ModalidadesAtendimento: postgresEnumArrayFromStrings(p.ModalidadesAtendimento),
		LocaisAtendimento:      p.LocaisAtendimento,
		DuracaoPadraoSessao:    p.DuracaoPadraoSessao,
		DiasAtendimento:        postgresEnumArrayFromStrings(p.DiasAtendimento),
		JanelasHorarias:        janelas,
		HorarioInicio:          p.HorarioInicio,
		HorarioFim:             p.HorarioFim,
		DuracaoConsulta:        p.DuracaoConsulta,
		ConsentimentoLGPD:      p.ConsentimentoLGPD,
		DataConsentimento:      p.DataConsentimento,
		CompartilhamentoDados:  p.CompartilhamentoDados,
		FinalidadeDados:        p.FinalidadeDados,
		Status:                 string(p.Status),
		Observacoes:            p.Observacoes,
		DadosComplementares:    dados,
		AnexosContratuais:      p.AnexosContratuais,
		CreatedAt:              p.CreatedAt,
		UpdatedAt:              p.UpdatedAt,
	}, nil
}

func profissionalModelToEntity(m *profissionalModel) (*entity.Profissional, error) {
	var janelas []map[string]interface{}
	if err := json.Unmarshal(m.JanelasHorarias, &janelas); err != nil {
		return nil, domainerrors.NewDatabaseError("falha ao ler janelas_horarias", err)
	}
	var dados map[string]interface{}
	if len(m.DadosComplementares) > 0 {
		if err := json.Unmarshal(m.DadosComplementares, &dados); err != nil {
			return nil, domainerrors.NewDatabaseError("falha ao ler dados_complementares", err)
		}
	}
	var conselho *entity.ConselhoTipo
	if m.Conselho != nil {
		ct := entity.ConselhoTipo(*m.Conselho)
		conselho = &ct
	}
	var deletedAt *time.Time
	if m.DeletedAt.Valid {
		t := m.DeletedAt.Time
		deletedAt = &t
	}
	return &entity.Profissional{
		ID:                     m.ID,
		Nome:                   m.Nome,
		CPF:                    m.CPF,
		RG:                     m.RG,
		DataNascimento:         m.DataNascimento,
		Email:                  m.Email,
		Telefone:               m.Telefone,
		Celular:                m.Celular,
		Conselho:               conselho,
		NumeroRegistro:         m.NumeroRegistro,
		UFRegistro:             m.UFRegistro,
		Foto:                   m.Foto,
		CEP:                    m.CEP,
		Logradouro:             m.Logradouro,
		Numero:                 m.Numero,
		Complemento:            m.Complemento,
		Bairro:                 m.Bairro,
		Cidade:                 m.Cidade,
		UF:                     m.UF,
		ModalidadesAtendimento: postgresEnumArrayToStrings(m.ModalidadesAtendimento),
		LocaisAtendimento:      m.LocaisAtendimento,
		DuracaoPadraoSessao:    m.DuracaoPadraoSessao,
		DiasAtendimento:        postgresEnumArrayToStrings(m.DiasAtendimento),
		JanelasHorarias:        janelas,
		HorarioInicio:          m.HorarioInicio,
		HorarioFim:             m.HorarioFim,
		DuracaoConsulta:        m.DuracaoConsulta,
		ConsentimentoLGPD:      m.ConsentimentoLGPD,
		DataConsentimento:      m.DataConsentimento,
		CompartilhamentoDados:  m.CompartilhamentoDados,
		FinalidadeDados:        m.FinalidadeDados,
		Status:                 entity.ProfissionalStatus(m.Status),
		Observacoes:            m.Observacoes,
		DadosComplementares:    dados,
		AnexosContratuais:      m.AnexosContratuais,
		CreatedAt:              m.CreatedAt,
		UpdatedAt:              m.UpdatedAt,
		DeletedAt:              deletedAt,
	}, nil
}

func profissionalConselhoEntityToModel(c *entity.ProfissionalConselho) *profissionalConselhoModel {
	return &profissionalConselhoModel{
		ID:             c.ID,
		ProfissionalID: c.ProfissionalID,
		Tipo:           string(c.Tipo),
		Numero:         c.Numero,
		UF:             c.UF,
		Validade:       c.Validade,
		Principal:      c.Principal,
		CreatedAt:      c.CreatedAt,
		UpdatedAt:      c.UpdatedAt,
	}
}

func profissionalConselhoModelToEntity(m *profissionalConselhoModel) *entity.ProfissionalConselho {
	c := &entity.ProfissionalConselho{
		ID:             m.ID,
		ProfissionalID: m.ProfissionalID,
		Tipo:           entity.ConselhoTipo(m.Tipo),
		Numero:         m.Numero,
		UF:             m.UF,
		Validade:       m.Validade,
		Principal:      m.Principal,
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
	}
	if m.DeletedAt.Valid {
		t := m.DeletedAt.Time
		c.DeletedAt = &t
	}
	return c
}

func mapProfissionalDBError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return domainerrors.NewNotFoundError("Profissional", "")
	}
	return MapDBError(err)
}
