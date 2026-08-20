package database

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// PostgresTerapiaRepository persiste tratamentos com itens de regime aninhados.
type PostgresTerapiaRepository struct {
	db *gorm.DB
}

func NewPostgresTerapiaRepository(db *gorm.DB) *PostgresTerapiaRepository {
	return &PostgresTerapiaRepository{db: db}
}

func (r *PostgresTerapiaRepository) Save(ctx context.Context, m *terapiaModel, itens []terapiaItemRegimeModel) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(m).Error; err != nil {
			return mapWaveDBError("Terapia", err)
		}
		for i := range itens {
			itens[i].TerapiaID = m.ID
			if err := tx.Create(&itens[i]).Error; err != nil {
				return mapWaveDBError("TerapiaItemRegime", err)
			}
		}
		return nil
	})
}

func (r *PostgresTerapiaRepository) FindByID(ctx context.Context, id uuid.UUID) (*terapiaModel, []terapiaItemRegimeModel, error) {
	var m terapiaModel
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&m).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil, nil
	}
	if err != nil {
		return nil, nil, mapWaveDBError("Terapia", err)
	}
	var itens []terapiaItemRegimeModel
	if err := r.db.WithContext(ctx).Where("terapia_id = ?", id).Find(&itens).Error; err != nil {
		return nil, nil, mapWaveDBError("TerapiaItemRegime", err)
	}
	return &m, itens, nil
}

func (r *PostgresTerapiaRepository) Update(ctx context.Context, m *terapiaModel, itens []terapiaItemRegimeModel) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(m).Where("id = ?", m.ID).Updates(m).Error; err != nil {
			return mapWaveDBError("Terapia", err)
		}
		if err := tx.Where("terapia_id = ?", m.ID).Delete(&terapiaItemRegimeModel{}).Error; err != nil {
			return mapWaveDBError("TerapiaItemRegime", err)
		}
		for i := range itens {
			itens[i].TerapiaID = m.ID
			if err := tx.Create(&itens[i]).Error; err != nil {
				return mapWaveDBError("TerapiaItemRegime", err)
			}
		}
		return nil
	})
}

func (r *PostgresTerapiaRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("terapia_id = ?", id).Delete(&terapiaItemRegimeModel{}).Error; err != nil {
			return mapWaveDBError("TerapiaItemRegime", err)
		}
		if err := tx.Where("id = ?", id).Delete(&terapiaModel{}).Error; err != nil {
			return mapWaveDBError("Terapia", err)
		}
		return nil
	})
}

func (r *PostgresTerapiaRepository) List(ctx context.Context, filter repository.CRUDListFilter) ([]*terapiaModel, int64, error) {
	filter.Page, filter.PageSize = service.NormalizePagination(filter.Page, filter.PageSize)
	cfg := crudListConfig{
		searchColumns: []string{"nome_terapia", "objetivo_terapeutico"},
		statusColumn:  "status",
		orderBy:       "nome_terapia ASC",
	}
	q := applyCRUDListFilter(r.db.WithContext(ctx).Model(&terapiaModel{}), filter, cfg)
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, mapWaveDBError("Terapia", err)
	}
	offset := (filter.Page - 1) * filter.PageSize
	var models []terapiaModel
	err := q.Order(cfg.orderBy).Offset(offset).Limit(filter.PageSize).Find(&models).Error
	if err != nil {
		return nil, 0, mapWaveDBError("Terapia", err)
	}
	out := make([]*terapiaModel, 0, len(models))
	for i := range models {
		out = append(out, &models[i])
	}
	return out, total, nil
}

func (r *PostgresTerapiaRepository) ListItens(ctx context.Context, terapiaID uuid.UUID) ([]terapiaItemRegimeModel, error) {
	var itens []terapiaItemRegimeModel
	if err := r.db.WithContext(ctx).Where("terapia_id = ?", terapiaID).Find(&itens).Error; err != nil {
		return nil, mapWaveDBError("TerapiaItemRegime", err)
	}
	return itens, nil
}

// PostgresRespostaAnamneseRepository persiste respostas de anamnese.
type PostgresRespostaAnamneseRepository struct {
	db *gorm.DB
}

func NewPostgresRespostaAnamneseRepository(db *gorm.DB) *PostgresRespostaAnamneseRepository {
	return &PostgresRespostaAnamneseRepository{db: db}
}

func (r *PostgresRespostaAnamneseRepository) Save(ctx context.Context, m *respostaAnamneseModel) error {
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return mapWaveDBError("RespostaAnamnese", err)
	}
	return nil
}

func (r *PostgresRespostaAnamneseRepository) List(ctx context.Context, filter repository.CRUDListFilter, questionnaireID, patientID *uuid.UUID) ([]*respostaAnamneseModel, int64, error) {
	filter.Page, filter.PageSize = service.NormalizePagination(filter.Page, filter.PageSize)
	q := r.db.WithContext(ctx).Model(&respostaAnamneseModel{})
	if questionnaireID != nil {
		q = q.Where("questionnaire_id = ?", *questionnaireID)
	}
	if patientID != nil {
		q = q.Where("patient_id = ?", *patientID)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, mapWaveDBError("RespostaAnamnese", err)
	}
	offset := (filter.Page - 1) * filter.PageSize
	var models []respostaAnamneseModel
	err := q.Order("data_hora DESC").Offset(offset).Limit(filter.PageSize).Find(&models).Error
	if err != nil {
		return nil, 0, mapWaveDBError("RespostaAnamnese", err)
	}
	out := make([]*respostaAnamneseModel, 0, len(models))
	for i := range models {
		out = append(out, &models[i])
	}
	return out, total, nil
}

// PostgresInventarioRepository persiste inventários com contagens.
type PostgresInventarioRepository struct {
	db *gorm.DB
}

func NewPostgresInventarioRepository(db *gorm.DB) *PostgresInventarioRepository {
	return &PostgresInventarioRepository{db: db}
}

func (r *PostgresInventarioRepository) Save(ctx context.Context, m *inventarioModel, contagens []inventarioContagemModel) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(m).Error; err != nil {
			return mapWaveDBError("Inventario", err)
		}
		for i := range contagens {
			contagens[i].InventarioID = m.ID
			if err := tx.Create(&contagens[i]).Error; err != nil {
				return mapWaveDBError("InventarioContagem", err)
			}
		}
		return nil
	})
}

func (r *PostgresInventarioRepository) FindByID(ctx context.Context, id uuid.UUID) (*inventarioModel, []inventarioContagemModel, error) {
	var m inventarioModel
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&m).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil, nil
	}
	if err != nil {
		return nil, nil, mapWaveDBError("Inventario", err)
	}
	var contagens []inventarioContagemModel
	if err := r.db.WithContext(ctx).Where("inventario_id = ?", id).Find(&contagens).Error; err != nil {
		return nil, nil, mapWaveDBError("InventarioContagem", err)
	}
	return &m, contagens, nil
}

func (r *PostgresInventarioRepository) Update(ctx context.Context, m *inventarioModel, contagens []inventarioContagemModel) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(m).Where("id = ?", m.ID).Updates(m).Error; err != nil {
			return mapWaveDBError("Inventario", err)
		}
		if err := tx.Where("inventario_id = ?", m.ID).Delete(&inventarioContagemModel{}).Error; err != nil {
			return mapWaveDBError("InventarioContagem", err)
		}
		for i := range contagens {
			contagens[i].InventarioID = m.ID
			if err := tx.Create(&contagens[i]).Error; err != nil {
				return mapWaveDBError("InventarioContagem", err)
			}
		}
		return nil
	})
}

func (r *PostgresInventarioRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("inventario_id = ?", id).Delete(&inventarioContagemModel{}).Error; err != nil {
			return mapWaveDBError("InventarioContagem", err)
		}
		if err := tx.Where("id = ?", id).Delete(&inventarioModel{}).Error; err != nil {
			return mapWaveDBError("Inventario", err)
		}
		return nil
	})
}

func (r *PostgresInventarioRepository) List(ctx context.Context, filter repository.CRUDListFilter) ([]*inventarioModel, int64, error) {
	filter.Page, filter.PageSize = service.NormalizePagination(filter.Page, filter.PageSize)
	q := r.db.WithContext(ctx).Model(&inventarioModel{})
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, mapWaveDBError("Inventario", err)
	}
	offset := (filter.Page - 1) * filter.PageSize
	var models []inventarioModel
	err := q.Order("data DESC").Offset(offset).Limit(filter.PageSize).Find(&models).Error
	if err != nil {
		return nil, 0, mapWaveDBError("Inventario", err)
	}
	out := make([]*inventarioModel, 0, len(models))
	for i := range models {
		out = append(out, &models[i])
	}
	return out, total, nil
}

// PostgresMovimentacaoEstoqueRepository persiste movimentações e atualiza saldo.
type PostgresMovimentacaoEstoqueRepository struct {
	db *gorm.DB
}

func NewPostgresMovimentacaoEstoqueRepository(db *gorm.DB) *PostgresMovimentacaoEstoqueRepository {
	return &PostgresMovimentacaoEstoqueRepository{db: db}
}

func (r *PostgresMovimentacaoEstoqueRepository) Save(ctx context.Context, m *movimentacaoEstoqueModel) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var item itemEstoqueModel
		if err := tx.Where("id = ?", m.ItemID).First(&item).Error; err != nil {
			return mapWaveDBError("ItemEstoque", err)
		}
		m.SaldoAnterior = item.EstoqueAtual
		switch m.Tipo {
		case "Entrada":
			item.EstoqueAtual += m.Quantidade
		case "Saída":
			if item.EstoqueAtual < m.Quantidade {
				return domainerrors.NewBusinessRuleError("saldo insuficiente para saída")
			}
			item.EstoqueAtual -= m.Quantidade
		case "Ajuste":
			item.EstoqueAtual = m.SaldoAtual
		default:
			return domainerrors.NewValidationError("tipo de movimentação inválido")
		}
		if m.Tipo != "Ajuste" {
			m.SaldoAtual = item.EstoqueAtual
		}
		if err := tx.Model(&item).Update("estoque_atual", item.EstoqueAtual).Error; err != nil {
			return mapWaveDBError("ItemEstoque", err)
		}
		if err := tx.Create(m).Error; err != nil {
			return mapWaveDBError("MovimentacaoEstoque", err)
		}
		return nil
	})
}

func (r *PostgresMovimentacaoEstoqueRepository) FindByID(ctx context.Context, id uuid.UUID) (*movimentacaoEstoqueModel, error) {
	var m movimentacaoEstoqueModel
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&m).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, mapWaveDBError("MovimentacaoEstoque", err)
	}
	return &m, nil
}

func (r *PostgresMovimentacaoEstoqueRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&movimentacaoEstoqueModel{}).Error
}

func (r *PostgresMovimentacaoEstoqueRepository) List(ctx context.Context, filter repository.CRUDListFilter, itemID *uuid.UUID) ([]*movimentacaoEstoqueModel, int64, error) {
	filter.Page, filter.PageSize = service.NormalizePagination(filter.Page, filter.PageSize)
	q := r.db.WithContext(ctx).Model(&movimentacaoEstoqueModel{})
	if itemID != nil {
		q = q.Where("item_id = ?", *itemID)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, mapWaveDBError("MovimentacaoEstoque", err)
	}
	offset := (filter.Page - 1) * filter.PageSize
	var models []movimentacaoEstoqueModel
	err := q.Order("data_hora DESC").Offset(offset).Limit(filter.PageSize).Find(&models).Error
	if err != nil {
		return nil, 0, mapWaveDBError("MovimentacaoEstoque", err)
	}
	out := make([]*movimentacaoEstoqueModel, 0, len(models))
	for i := range models {
		out = append(out, &models[i])
	}
	return out, total, nil
}

// ── Mappers model → DTO ─────────────────────────────────────────────────────

func toTerapiaDTO(m *terapiaModel, itens []terapiaItemRegimeModel) service.TerapiaDTO {
	dto := service.TerapiaDTO{
		ID:                       m.ID,
		NomeTerapia:           m.NomeTerapia,
		ObjetivoTerapeutico:      m.ObjetivoTerapeutico,
		DiretrizProtocolar:       m.DiretrizProtocolar,
		CodigosReferencia:        servicePqToSlice(m.CodigosReferencia),
		RegraAjuste:              m.RegraAjuste,
		Indicacoes:               m.Indicacoes,
		Contraindicacoes:         m.Contraindicacoes,
		InteracoesRelevantes:     m.InteracoesRelevantes,
		Monitorizacao:            m.Monitorizacao,
		EventosAdversos:          m.EventosAdversos,
		NecessidadeConsentimento: m.NecessidadeConsentimento,
		TextoConsentimento:       m.TextoConsentimento,
		Status:                   m.Status,
		Versao:                   m.Versao,
		Anexos:                   servicePqToSlice(m.Anexos),
		Tags:                     servicePqToSlice(m.Tags),
		Observacoes:              m.Observacoes,
		CreatedAt:                m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:                m.UpdatedAt.UTC().Format(time.RFC3339),
	}
	for _, it := range itens {
		dto.ItensRegime = append(dto.ItensRegime, service.ItemRegimeDTO{
			ID:             it.ID,
			Medicamento:    it.Medicamento,
			Via:            it.Via,
			Dose:           it.Dose,
			DoseUnidade:    it.DoseUnidade,
			Frequencia:     it.Frequencia,
			Horario:        it.Horario,
			Duracao:        it.Duracao,
			DuracaoUnidade: it.DuracaoUnidade,
			Orientacoes:    it.Orientacoes,
		})
	}
	return dto
}

func servicePqToSlice(arr pq.StringArray) []string {
	if len(arr) == 0 {
		return nil
	}
	out := make([]string, len(arr))
	copy(out, arr)
	return out
}

func buildTerapiaModel(id uuid.UUID, in service.TerapiaInput, now time.Time) (*terapiaModel, []terapiaItemRegimeModel) {
	status := in.Status
	if status == "" {
		status = "Ativo"
	}
	versao := in.Versao
	if versao < 1 {
		versao = 1
	}
	m := &terapiaModel{
		ID:                       id,
		NomeTerapia:           in.NomeTerapia,
		ObjetivoTerapeutico:      in.ObjetivoTerapeutico,
		DiretrizProtocolar:       in.DiretrizProtocolar,
		CodigosReferencia:        pq.StringArray(in.CodigosReferencia),
		RegraAjuste:              in.RegraAjuste,
		Indicacoes:               in.Indicacoes,
		Contraindicacoes:         in.Contraindicacoes,
		InteracoesRelevantes:     in.InteracoesRelevantes,
		Monitorizacao:            in.Monitorizacao,
		EventosAdversos:          in.EventosAdversos,
		NecessidadeConsentimento: in.NecessidadeConsentimento,
		TextoConsentimento:       in.TextoConsentimento,
		Status:                   status,
		Versao:                   versao,
		Anexos:                   pq.StringArray(in.Anexos),
		Tags:                     pq.StringArray(in.Tags),
		Observacoes:              in.Observacoes,
		CreatedAt:                now,
		UpdatedAt:                now,
	}
	itens := make([]terapiaItemRegimeModel, 0, len(in.ItensRegime))
	for _, it := range in.ItensRegime {
		itemID := it.ID
		if itemID == uuid.Nil {
			itemID = uuid.New()
		}
		itens = append(itens, terapiaItemRegimeModel{
			ID:             itemID,
			Medicamento:    it.Medicamento,
			Via:            it.Via,
			Dose:           it.Dose,
			DoseUnidade:    it.DoseUnidade,
			Frequencia:     it.Frequencia,
			Horario:        it.Horario,
			Duracao:        it.Duracao,
			DuracaoUnidade: it.DuracaoUnidade,
			Orientacoes:    it.Orientacoes,
		})
	}
	return m, itens
}

func toAnamneseDTO(m *anamneseModel) service.AnamneseDTO {
	q := json.RawMessage("[]")
	if len(m.Questionnaire) > 0 {
		q = json.RawMessage(m.Questionnaire)
	}
	return service.AnamneseDTO{
		ID:            m.ID,
		Nome:          m.Nome,
		Especialidade: m.Especialidade,
		Versao:        m.Versao,
		Status:        m.Status,
		Questionnaire: q,
		Observacoes:   m.Observacoes,
		CreatedAt:     m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:     m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toRespostaAnamneseDTO(m *respostaAnamneseModel) service.RespostaAnamneseDTO {
	r := json.RawMessage("{}")
	if len(m.Respostas) > 0 {
		r = json.RawMessage(m.Respostas)
	}
	return service.RespostaAnamneseDTO{
		ID:                m.ID,
		QuestionnaireID:   m.QuestionnaireID,
		QuestionnaireNome: m.QuestionnaireNome,
		PatientID:         m.PatientID,
		PatientNome:       m.PatientNome,
		EncounterID:       m.EncounterID,
		Respostas:         r,
		DataHora:          m.DataHora.UTC().Format(time.RFC3339),
		CreatedAt:         m.CreatedAt.UTC().Format(time.RFC3339),
	}
}

func formatOptionalDatePtr(t *time.Time) *string {
	if t == nil {
		return nil
	}
	s := t.Format("2006-01-02")
	return &s
}

func toCategoriaFinanceiraDTO(m *categoriaFinanceiraModel) service.CategoriaFinanceiraDTO {
	return service.CategoriaFinanceiraDTO{
		ID: m.ID, Nome: m.Nome, Tipo: m.Tipo, Cor: m.Cor, Descricao: m.Descricao,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toCentroCustoDTO(m *centroCustoModel) service.CentroCustoDTO {
	return service.CentroCustoDTO{
		ID: m.ID, Codigo: m.Codigo, Nome: m.Nome, Descricao: m.Descricao, Ativo: m.Ativo,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toLancamentoDTO(m *lancamentoModel) service.LancamentoDTO {
	return service.LancamentoDTO{
		ID: m.ID, Tipo: m.Tipo, Descricao: m.Descricao, Valor: m.Valor,
		DataVencimento: m.DataVencimento.Format("2006-01-02"),
		DataPagamento:  formatOptionalDatePtr(m.DataPagamento),
		CategoriaID: m.CategoriaID, CategoriaNome: m.CategoriaNome,
		CentroCustoID: m.CentroCustoID, CentroCustoNome: m.CentroCustoNome,
		FormaPagamento: m.FormaPagamento, Documento: m.Documento, Observacoes: m.Observacoes,
		Status: m.Status, Recorrente: m.Recorrente, FrequenciaRecorrencia: m.FrequenciaRecorrencia,
		Parcelas: m.Parcelas, ParcelaAtual: m.ParcelaAtual, AnexoURL: m.AnexoURL,
		Conciliado: m.Conciliado, DataConciliacao: formatOptionalDatePtr(m.DataConciliacao),
		UnidadeID: m.UnidadeID,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toRelatorioOperacionalDTO(m *relatorioOperacionalModel) service.RelatorioOperacionalDTO {
	h := json.RawMessage("[]")
	if len(m.HistoricoVersoes) > 0 {
		h = json.RawMessage(m.HistoricoVersoes)
	}
	return service.RelatorioOperacionalDTO{
		ID: m.ID, Numero: m.Numero, PacienteNome: m.PacienteNome,
		ProfissionalNome: m.ProfissionalNome, Terapia: m.Terapia, Periodo: m.Periodo,
		Valor: m.Valor, Status: m.Status, UnidadeID: m.UnidadeID,
		DataSubmissao: formatOptionalDatePtr(m.DataSubmissao),
		DataAprovacao: formatOptionalDatePtr(m.DataAprovacao),
		AprovadoPor: m.AprovadoPor, Observacoes: m.Observacoes, HistoricoVersoes: h,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toFuncionarioCLTDTO(m *funcionarioCLTModel) service.FuncionarioCLTDTO {
	return service.FuncionarioCLTDTO{
		ID: m.ID, UnidadeID: m.UnidadeID, Nome: m.Nome, CPF: m.CPF, Cargo: m.Cargo,
		SalarioBase: m.SalarioBase, DataAdmissao: m.DataAdmissao.Format("2006-01-02"),
		Ativo: m.Ativo, Dependentes: m.Dependentes, ValeTransporte: m.ValeTransporte,
		ValeAlimentacao: m.ValeAlimentacao,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toFuncionarioPJDTO(m *funcionarioPJModel) service.FuncionarioPJDTO {
	return service.FuncionarioPJDTO{
		ID: m.ID, UnidadeID: m.UnidadeID, Nome: m.Nome, CNPJ: m.CNPJ,
		RazaoSocial: m.RazaoSocial, Servico: m.Servico, ValorHora: m.ValorHora,
		DataInicio: m.DataInicio.Format("2006-01-02"), Ativo: m.Ativo,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toFolhaCLTDTO(m *folhaCLTModel) service.FolhaCLTDTO {
	return service.FolhaCLTDTO{
		ID: m.ID, FuncionarioID: m.FuncionarioID, MesReferencia: m.MesReferencia,
		SalarioBase: m.SalarioBase, HorasExtras: m.HorasExtras, AdicionalNoturno: m.AdicionalNoturno,
		OutrosProventos: m.OutrosProventos, ValeTransporte: m.ValeTransporte, ValeAlimentacao: m.ValeAlimentacao,
		INSS: m.INSS, FGTS: m.FGTS, IRRF: m.IRRF, OutrosDescontos: m.OutrosDescontos,
		SalarioLiquido: m.SalarioLiquido, DataPagamento: formatOptionalDatePtr(m.DataPagamento),
		Status: m.Status,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toFolhaPJDTO(m *folhaPJModel) service.FolhaPJDTO {
	return service.FolhaPJDTO{
		ID: m.ID, FuncionarioID: m.FuncionarioID, MesReferencia: m.MesReferencia,
		HorasTrabalhadas: m.HorasTrabalhadas, ValorHora: m.ValorHora, ValorTotal: m.ValorTotal,
		RetencaoISS: m.RetencaoISS, RetencaoIR: m.RetencaoIR, ValorLiquido: m.ValorLiquido,
		DataPagamento: formatOptionalDatePtr(m.DataPagamento), Status: m.Status,
		DescricaoServicos: m.DescricaoServicos,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toItemEstoqueDTO(m *itemEstoqueModel) service.ItemEstoqueDTO {
	return service.ItemEstoqueDTO{
		ID: m.ID, UnidadeID: m.UnidadeID, Codigo: m.Codigo, Nome: m.Nome, Categoria: m.Categoria,
		UnidadeMedida: m.UnidadeMedida, EstoqueAtual: m.EstoqueAtual, EstoqueMinimo: m.EstoqueMinimo,
		Localizacao: m.Localizacao, Status: m.Status,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toMovimentacaoDTO(m *movimentacaoEstoqueModel) service.MovimentacaoEstoqueDTO {
	return service.MovimentacaoEstoqueDTO{
		ID: m.ID, ItemID: m.ItemID, ItemNome: m.ItemNome, Tipo: m.Tipo, Quantidade: m.Quantidade,
		DataHora: m.DataHora.UTC().Format(time.RFC3339), Documento: m.Documento, Motivo: m.Motivo,
		ResponsavelID: m.ResponsavelID, ResponsavelNome: m.ResponsavelNome,
		SaldoAnterior: m.SaldoAnterior, SaldoAtual: m.SaldoAtual,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
	}
}

func toInventarioDTO(m *inventarioModel, contagens []inventarioContagemModel) service.InventarioDTO {
	dto := service.InventarioDTO{
		ID: m.ID, Data: m.Data.Format("2006-01-02"),
		ResponsavelID: m.ResponsavelID, ResponsavelNome: m.ResponsavelNome,
		Observacoes: m.Observacoes,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
	}
	for _, c := range contagens {
		div := c.ContagemFisica - c.EstoqueSistema
		dto.Contagens = append(dto.Contagens, service.InventarioContagemDTO{
			ItemID: c.ItemID, ItemNome: c.ItemNome,
			EstoqueSistema: c.EstoqueSistema, ContagemFisica: c.ContagemFisica, Divergencia: div,
		})
	}
	return dto
}

func toComodatoDTO(m *comodatoModel) service.ComodatoDTO {
	return service.ComodatoDTO{
		ID: m.ID, ItemID: m.ItemID, ItemNome: m.ItemNome, Descricao: m.Descricao,
		PacienteID: m.PacienteID, PacienteNome: m.PacienteNome,
		DataEmprestimo: m.DataEmprestimo.Format("2006-01-02"),
		DataDevolucaoPrevista: m.DataDevolucaoPrevista.Format("2006-01-02"),
		DataDevolucaoReal: formatOptionalDatePtr(m.DataDevolucaoReal),
		Status: m.Status, CondicaoEntrega: m.CondicaoEntrega, CondicaoDevolucao: m.CondicaoDevolucao,
		Observacoes: m.Observacoes, ResponsavelID: m.ResponsavelID, ResponsavelNome: m.ResponsavelNome,
		NumeroSerie: m.NumeroSerie, Quantidade: m.Quantidade,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toPlanoSaudeDTO(m *planoSaudeModel) service.PlanoSaudeDTO {
	return service.PlanoSaudeDTO{
		ID: m.ID, Nome: m.Nome, CNPJ: m.CNPJ, RegistroANS: m.RegistroANS,
		Telefone: m.Telefone, Email: m.Email, Endereco: m.Endereco, Ativo: m.Ativo,
		Observacoes: m.Observacoes,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toAcaoJudicialDTO(m *acaoJudicialModel) service.AcaoJudicialDTO {
	return service.AcaoJudicialDTO{
		ID: m.ID, NumeroProcesso: m.NumeroProcesso, PlanoSaudeID: m.PlanoSaudeID,
		PlanoSaudeNome: m.PlanoSaudeNome, ValorAcao: m.ValorAcao,
		DataEntrada: m.DataEntrada.Format("2006-01-02"),
		DataSentenca: formatOptionalDatePtr(m.DataSentenca),
		Status: m.Status, Descricao: m.Descricao, Observacoes: m.Observacoes,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toNotaFiscalDTO(m *notaFiscalModel) service.NotaFiscalDTO {
	var dataConc *string
	if m.DataConciliacao != nil {
		s := m.DataConciliacao.UTC().Format(time.RFC3339)
		dataConc = &s
	}
	return service.NotaFiscalDTO{
		ID: m.ID, NumeroNota: m.NumeroNota, PlanoSaudeID: m.PlanoSaudeID,
		PlanoSaudeNome: m.PlanoSaudeNome, PacienteNome: m.PacienteNome,
		DataEmissao: m.DataEmissao.Format("2006-01-02"),
		DataVencimento: m.DataVencimento.Format("2006-01-02"),
		ValorServico: m.ValorServico, ValorPago: m.ValorPago, Status: m.Status,
		AcaoJudicialID: m.AcaoJudicialID, DataConciliacao: dataConc, Observacoes: m.Observacoes,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toContratoDTO(m *contratoModel) service.ContratoDTO {
	return service.ContratoDTO{
		ID: m.ID, Titulo: m.Titulo, Tipo: m.Tipo, PacienteID: m.PacienteID,
		PacienteNome: m.PacienteNome, ProfissionalID: m.ProfissionalID, ProfissionalNome: m.ProfissionalNome,
		Conteudo: m.Conteudo, Status: m.Status, CriadoPor: m.CriadoPor,
		CriadoEm: m.CriadoEm.UTC().Format(time.RFC3339),
		AtualizadoEm: m.AtualizadoEm.UTC().Format(time.RFC3339),
	}
}

func toManualDTO(m *manualModel) service.ManualDTO {
	return service.ManualDTO{
		ID: m.ID, Titulo: m.Titulo, Versao: m.Versao, PublicoAlvo: m.PublicoAlvo,
		ArquivoURL: m.ArquivoURL, ArquivoNome: m.ArquivoNome, Tags: servicePqToSlice(m.Tags),
		Status: m.Status, Observacoes: m.Observacoes, CreatedBy: m.CreatedBy,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toMaterialMarketingDTO(m *materialMarketingModel) service.MaterialMarketingDTO {
	return service.MaterialMarketingDTO{
		ID: m.ID, Titulo: m.Titulo, Tipo: m.Tipo, ArquivoURL: m.ArquivoURL,
		ArquivoNome: m.ArquivoNome, Tags: servicePqToSlice(m.Tags), Campanha: m.Campanha,
		UnidadeID: m.UnidadeID, Status: m.Status, Observacoes: m.Observacoes, CreatedBy: m.CreatedBy,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt: m.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toContaContabilDTO(m *contaContabilModel) service.ContaContabilDTO {
	return service.ContaContabilDTO{
		Codigo: m.Codigo, Nome: m.Nome, Tipo: m.Tipo, Natureza: m.Natureza, Pai: m.Pai,
	}
}

func toLancamentoContabilDTO(m *lancamentoContabilModel) service.LancamentoContabilDTO {
	return service.LancamentoContabilDTO{
		ID: m.ID, Data: m.Data.Format("2006-01-02"), ContaCodigo: m.ContaCodigo,
		ContaNome: m.ContaNome, Debito: m.Debito, Credito: m.Credito, Historico: m.Historico,
		CentroCusto: m.CentroCusto, UnidadeID: m.UnidadeID, ProfissionalID: m.ProfissionalID,
		Convenio: m.Convenio, Documento: m.Documento,
		CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
	}
}

func toAuditLogDTO(m *auditLogModel) service.AuditLogDTO {
	d := json.RawMessage(nil)
	if len(m.Diff) > 0 {
		d = json.RawMessage(m.Diff)
	}
	return service.AuditLogDTO{
		ID: m.ID, ActorID: m.ActorID, ActorName: m.ActorName, ActorRole: m.ActorRole,
		Acao: m.Acao, Entidade: m.Entidade, EntidadeID: m.EntidadeID, Diff: d,
		IP: m.IP, UserAgent: m.UserAgent,
		TimestampUTC: m.TimestampUTC.UTC().Format(time.RFC3339),
	}
}
