package database

import (
	"context"
	"errors"
	"strings"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	"espaco-terapia-os/backend/internal/domain/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresBibliotecaDocumentoRepository struct {
	db *gorm.DB
}

func NewPostgresBibliotecaDocumentoRepository(db *gorm.DB) *PostgresBibliotecaDocumentoRepository {
	return &PostgresBibliotecaDocumentoRepository{db: db}
}

func (r *PostgresBibliotecaDocumentoRepository) CreateCategoria(ctx context.Context, cat *entity.BibliotecaCategoria) error {
	var desc *string
	if cat.Descricao != "" {
		desc = &cat.Descricao
	}
	m := documentoCategoriaModel{
		ID:        cat.ID,
		Nome:      cat.Nome,
		Descricao: desc,
		Ordem:     cat.Ordem,
		Ativo:     cat.Ativo,
	}
	return r.db.WithContext(ctx).Create(&m).Error
}

func (r *PostgresBibliotecaDocumentoRepository) UpdateCategoria(ctx context.Context, cat *entity.BibliotecaCategoria) error {
	var desc *string
	if cat.Descricao != "" {
		desc = &cat.Descricao
	}
	return r.db.WithContext(ctx).Model(&documentoCategoriaModel{}).Where("id = ?", cat.ID).Updates(map[string]interface{}{
		"nome":      cat.Nome,
		"descricao": desc,
		"ordem":     cat.Ordem,
		"ativo":     cat.Ativo,
	}).Error
}

func (r *PostgresBibliotecaDocumentoRepository) FindCategoriaByID(ctx context.Context, id uuid.UUID) (*entity.BibliotecaCategoria, error) {
	var m documentoCategoriaModel
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&m).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return categoriaModelToEntity(&m), nil
}

func (r *PostgresBibliotecaDocumentoRepository) ListCategorias(ctx context.Context, filter repository.DocumentoCategoriaListFilter) ([]*entity.BibliotecaCategoria, error) {
	q := r.db.WithContext(ctx).Model(&documentoCategoriaModel{})
	if !filter.IncludeInativas {
		q = q.Where("ativo = ?", true)
	}
	var rows []documentoCategoriaModel
	if err := q.Order("ordem ASC, nome ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]*entity.BibliotecaCategoria, 0, len(rows))
	for i := range rows {
		out = append(out, categoriaModelToEntity(&rows[i]))
	}
	return out, nil
}

func (r *PostgresBibliotecaDocumentoRepository) SoftDeleteCategoria(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&documentoCategoriaModel{}).Error
}

func (r *PostgresBibliotecaDocumentoRepository) ExistsCategoriaNome(ctx context.Context, nome string, excludeID *uuid.UUID) (bool, error) {
	q := r.db.WithContext(ctx).Model(&documentoCategoriaModel{}).
		Where("lower(nome) = lower(?)", strings.TrimSpace(nome))
	if excludeID != nil {
		q = q.Where("id <> ?", *excludeID)
	}
	var count int64
	if err := q.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *PostgresBibliotecaDocumentoRepository) CreateArquivo(ctx context.Context, arq *entity.BibliotecaArquivo) error {
	var titulo *string
	if arq.Titulo != "" {
		titulo = &arq.Titulo
	}
	m := bibliotecaArquivoModel{
		ID:           arq.ID,
		CategoriaID:  arq.CategoriaID,
		Titulo:       titulo,
		NomeArquivo:  arq.NomeArquivo,
		MimeType:     arq.MimeType,
		TamanhoBytes: arq.TamanhoBytes,
		StoragePath:  arq.StoragePath,
		UploadedBy:   arq.UploadedBy,
		UploadedAt:   arq.UploadedAt,
	}
	return r.db.WithContext(ctx).Create(&m).Error
}

func (r *PostgresBibliotecaDocumentoRepository) FindArquivoByID(ctx context.Context, id uuid.UUID) (*entity.BibliotecaArquivo, error) {
	var row bibliotecaArquivoRow
	err := r.arquivoBaseQuery(ctx).Where("ba.id = ?", id).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return arquivoRowToEntity(&row), nil
}

func (r *PostgresBibliotecaDocumentoRepository) applyArquivoFilters(
	q *gorm.DB,
	filter repository.BibliotecaArquivoListFilter,
) *gorm.DB {
	if filter.CategoriaID != nil {
		q = q.Where("ba.categoria_id = ?", *filter.CategoriaID)
	}
	if qStr := strings.TrimSpace(filter.Query); qStr != "" {
		like := "%" + strings.ToLower(qStr) + "%"
		q = q.Where(
			"lower(coalesce(ba.titulo, '')) LIKE ? OR lower(ba.nome_arquivo) LIKE ? OR lower(dc.nome) LIKE ?",
			like, like, like,
		)
	}
	return q
}

func (r *PostgresBibliotecaDocumentoRepository) ListArquivos(ctx context.Context, filter repository.BibliotecaArquivoListFilter) (*repository.BibliotecaArquivoListResult, error) {
	page := filter.Page
	if page < 1 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 500 {
		pageSize = 500
	}

	countQ := r.applyArquivoFilters(r.arquivoBaseQuery(ctx), filter)
	var total int64
	if err := countQ.Count(&total).Error; err != nil {
		return nil, err
	}

	var rows []bibliotecaArquivoRow
	offset := (page - 1) * pageSize
	findQ := r.applyArquivoFilters(r.arquivoBaseQuery(ctx), filter)
	if err := findQ.Order("ba.uploaded_at DESC").Offset(offset).Limit(pageSize).Find(&rows).Error; err != nil {
		return nil, err
	}

	items := make([]*entity.BibliotecaArquivo, 0, len(rows))
	for i := range rows {
		items = append(items, arquivoRowToEntity(&rows[i]))
	}
	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		totalPages++
	}
	return &repository.BibliotecaArquivoListResult{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (r *PostgresBibliotecaDocumentoRepository) SoftDeleteArquivo(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&bibliotecaArquivoModel{}).Error
}

func (r *PostgresBibliotecaDocumentoRepository) CountActiveArquivosByCategoria(ctx context.Context, categoriaID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&bibliotecaArquivoModel{}).
		Where("categoria_id = ?", categoriaID).
		Count(&count).Error
	return count, err
}

func bibliotecaArquivoSelectColumns() string {
	return `ba.id, ba.categoria_id, ba.titulo, ba.nome_arquivo, ba.mime_type, ba.tamanho_bytes,
		ba.storage_path, ba.uploaded_by, ba.uploaded_at, ba.deleted_at,
		dc.nome AS categoria_nome, COALESCE(u.name, '') AS uploaded_by_nome`
}

func (r *PostgresBibliotecaDocumentoRepository) arquivoBaseQuery(ctx context.Context) *gorm.DB {
	return r.db.WithContext(ctx).
		Table("biblioteca_arquivos AS ba").
		Select(bibliotecaArquivoSelectColumns()).
		Joins("JOIN documento_categorias dc ON dc.id = ba.categoria_id AND dc.deleted_at IS NULL").
		Joins("LEFT JOIN users u ON u.id = ba.uploaded_by").
		Where("ba.deleted_at IS NULL")
}

func categoriaModelToEntity(m *documentoCategoriaModel) *entity.BibliotecaCategoria {
	var deleted *time.Time
	if m.DeletedAt.Valid {
		t := m.DeletedAt.Time
		deleted = &t
	}
	desc := ""
	if m.Descricao != nil {
		desc = *m.Descricao
	}
	return &entity.BibliotecaCategoria{
		ID:        m.ID,
		Nome:      m.Nome,
		Descricao: desc,
		Ordem:     m.Ordem,
		Ativo:     m.Ativo,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
		DeletedAt: deleted,
	}
}

func arquivoRowToEntity(row *bibliotecaArquivoRow) *entity.BibliotecaArquivo {
	var deleted *time.Time
	if row.DeletedAt.Valid {
		t := row.DeletedAt.Time
		deleted = &t
	}
	titulo := ""
	if row.Titulo != nil {
		titulo = *row.Titulo
	}
	return &entity.BibliotecaArquivo{
		ID:             row.ID,
		CategoriaID:    row.CategoriaID,
		Titulo:         titulo,
		NomeArquivo:    row.NomeArquivo,
		MimeType:       row.MimeType,
		TamanhoBytes:   row.TamanhoBytes,
		StoragePath:    row.StoragePath,
		UploadedBy:     row.UploadedBy,
		UploadedAt:     row.UploadedAt,
		DeletedAt:      deleted,
		CategoriaNome:  row.CategoriaNome,
		UploadedByNome: row.UploadedByNome,
	}
}

// Compile-time check: implements both repository interfaces via wrapper in deps.
var (
	_ repository.DocumentoCategoriaRepository = (*postgresCategoriaRepoAdapter)(nil)
	_ repository.BibliotecaArquivoRepository    = (*postgresArquivoRepoAdapter)(nil)
)

type postgresCategoriaRepoAdapter struct{ inner *PostgresBibliotecaDocumentoRepository }

func NewPostgresDocumentoCategoriaRepository(db *gorm.DB) repository.DocumentoCategoriaRepository {
	return &postgresCategoriaRepoAdapter{inner: NewPostgresBibliotecaDocumentoRepository(db)}
}

func (a *postgresCategoriaRepoAdapter) Create(ctx context.Context, cat *entity.BibliotecaCategoria) error {
	return a.inner.CreateCategoria(ctx, cat)
}
func (a *postgresCategoriaRepoAdapter) Update(ctx context.Context, cat *entity.BibliotecaCategoria) error {
	return a.inner.UpdateCategoria(ctx, cat)
}
func (a *postgresCategoriaRepoAdapter) FindByID(ctx context.Context, id uuid.UUID) (*entity.BibliotecaCategoria, error) {
	return a.inner.FindCategoriaByID(ctx, id)
}
func (a *postgresCategoriaRepoAdapter) List(ctx context.Context, filter repository.DocumentoCategoriaListFilter) ([]*entity.BibliotecaCategoria, error) {
	return a.inner.ListCategorias(ctx, filter)
}
func (a *postgresCategoriaRepoAdapter) SoftDelete(ctx context.Context, id uuid.UUID) error {
	return a.inner.SoftDeleteCategoria(ctx, id)
}
func (a *postgresCategoriaRepoAdapter) ExistsNome(ctx context.Context, nome string, excludeID *uuid.UUID) (bool, error) {
	return a.inner.ExistsCategoriaNome(ctx, nome, excludeID)
}

type postgresArquivoRepoAdapter struct{ inner *PostgresBibliotecaDocumentoRepository }

func NewPostgresBibliotecaArquivoRepository(db *gorm.DB) repository.BibliotecaArquivoRepository {
	return &postgresArquivoRepoAdapter{inner: NewPostgresBibliotecaDocumentoRepository(db)}
}

func (a *postgresArquivoRepoAdapter) Create(ctx context.Context, arq *entity.BibliotecaArquivo) error {
	return a.inner.CreateArquivo(ctx, arq)
}
func (a *postgresArquivoRepoAdapter) FindByID(ctx context.Context, id uuid.UUID) (*entity.BibliotecaArquivo, error) {
	return a.inner.FindArquivoByID(ctx, id)
}
func (a *postgresArquivoRepoAdapter) List(ctx context.Context, filter repository.BibliotecaArquivoListFilter) (*repository.BibliotecaArquivoListResult, error) {
	return a.inner.ListArquivos(ctx, filter)
}
func (a *postgresArquivoRepoAdapter) SoftDelete(ctx context.Context, id uuid.UUID) error {
	return a.inner.SoftDeleteArquivo(ctx, id)
}
func (a *postgresArquivoRepoAdapter) CountActiveByCategoria(ctx context.Context, categoriaID uuid.UUID) (int64, error) {
	return a.inner.CountActiveArquivosByCategoria(ctx, categoriaID)
}
