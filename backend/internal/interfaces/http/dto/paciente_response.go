package dto

import "espaco-terapia-os/backend/internal/domain/service"

type PacienteResponse = service.PacienteDTO

type ListMeta struct {
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

type CreatePacienteData struct {
	ID string `json:"id"`
}
