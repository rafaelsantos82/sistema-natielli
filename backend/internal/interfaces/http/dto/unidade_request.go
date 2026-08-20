package dto

import "espaco-terapia-os/backend/internal/domain/service"

type ListUnidadesQuery struct {
	Query    string `form:"q"`
	Status   string `form:"status"`
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
}

type UnidadeResponse = service.UnidadeDTO
