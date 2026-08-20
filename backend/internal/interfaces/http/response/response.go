package response

import "github.com/gin-gonic/gin"

type ErrorDetail struct {
	Field   string `json:"field,omitempty"`
	Message string `json:"message"`
}

type ErrorEnvelope struct {
	Error struct {
		Code    string        `json:"code"`
		Message string        `json:"message"`
		Details []ErrorDetail `json:"details"`
	} `json:"error"`
}

type SuccessEnvelope[T any] struct {
	Data T   `json:"data"`
	Meta any `json:"meta"`
}

func JSONSuccess[T any](c *gin.Context, status int, data T, meta any) {
	c.JSON(status, SuccessEnvelope[T]{
		Data: data,
		Meta: meta,
	})
}

func JSONError(c *gin.Context, status int, code, message string, details []ErrorDetail) {
	resp := ErrorEnvelope{}
	resp.Error.Code = code
	resp.Error.Message = message
	resp.Error.Details = details
	c.JSON(status, resp)
}
