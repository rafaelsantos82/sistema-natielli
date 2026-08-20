package service

const (
	DefaultPageSize = 20
	MaxPageSize     = 100
)

// NormalizePagination aplica defaults e teto de page_size (evita full scan acidental).
func NormalizePagination(page, pageSize int) (int, int) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = DefaultPageSize
	}
	if pageSize > MaxPageSize {
		pageSize = MaxPageSize
	}
	return page, pageSize
}

// TotalPages calcula páginas a partir do total de registros.
func TotalPages(total int64, pageSize int) int {
	if total == 0 {
		return 0
	}
	pages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		pages++
	}
	return pages
}
