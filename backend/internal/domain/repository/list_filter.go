package repository

import "github.com/google/uuid"

// ListFilter campos comuns de paginação e escopo por unidade.
type ListFilter struct {
	UnidadeID *uuid.UUID
	Query     string
	Page      int
	PageSize  int
}
