package service

import (
	"fmt"
	"mime"
	"os"
	"path/filepath"
	"strings"
)

const DefaultUploadMaxBytes int64 = 10 * 1024 * 1024

var defaultAllowedExtensions = []string{
	"jpg", "jpeg", "png", "webp",
	"txt", "csv",
	"xls", "xlsx",
	"doc", "docx",
	"pdf",
}

var defaultAllowedMimeTypes = []string{
	"image/jpeg", "image/png", "image/webp",
	"text/plain", "text/csv",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/pdf",
}

type UploadPolicy struct {
	MaxBytes          int64
	AllowedExtensions map[string]struct{}
	AllowedMimeTypes  map[string]struct{}
}

var contratoAllowedExtensions = []string{"pdf", "doc", "docx"}

var contratoAllowedMimeTypes = []string{
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

// ContratoUploadPolicy restringe contratos a PDF e Word (DOC/DOCX).
func ContratoUploadPolicy() UploadPolicy {
	maxBytes := DefaultUploadMaxBytes
	if v := strings.TrimSpace(os.Getenv("UPLOAD_MAX_BYTES")); v != "" {
		var parsed int64
		if _, err := fmt.Sscanf(v, "%d", &parsed); err == nil && parsed > 0 {
			maxBytes = parsed
		}
	}
	return NewUploadPolicy(maxBytes, contratoAllowedExtensions, contratoAllowedMimeTypes)
}

func LoadUploadPolicyFromEnv() UploadPolicy {
	maxBytes := DefaultUploadMaxBytes
	if v := strings.TrimSpace(os.Getenv("UPLOAD_MAX_BYTES")); v != "" {
		var parsed int64
		if _, err := fmt.Sscanf(v, "%d", &parsed); err == nil && parsed > 0 {
			maxBytes = parsed
		}
	}
	exts := splitCSVEnv(os.Getenv("UPLOAD_ALLOWED_EXTENSIONS"), defaultAllowedExtensions)
	mimes := splitCSVEnv(os.Getenv("UPLOAD_ALLOWED_MIME_TYPES"), defaultAllowedMimeTypes)
	return NewUploadPolicy(maxBytes, exts, mimes)
}

func NewUploadPolicy(maxBytes int64, extensions, mimeTypes []string) UploadPolicy {
	extMap := make(map[string]struct{}, len(extensions))
	for _, e := range extensions {
		extMap[strings.ToLower(strings.TrimPrefix(e, "."))] = struct{}{}
	}
	mimeMap := make(map[string]struct{}, len(mimeTypes))
	for _, m := range mimeTypes {
		mimeMap[strings.ToLower(strings.TrimSpace(m))] = struct{}{}
	}
	if maxBytes <= 0 {
		maxBytes = DefaultUploadMaxBytes
	}
	return UploadPolicy{
		MaxBytes:          maxBytes,
		AllowedExtensions: extMap,
		AllowedMimeTypes:  mimeMap,
	}
}

func (p UploadPolicy) ValidateUpload(originalName, declaredMIME string, size int64) error {
	if size <= 0 {
		return fmt.Errorf("arquivo vazio")
	}
	if size > p.MaxBytes {
		return fmt.Errorf("arquivo excede o limite de %d MB", p.MaxBytes/(1024*1024))
	}
	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(originalName), "."))
	if ext == "" {
		return fmt.Errorf("arquivo sem extensão")
	}
	if strings.Contains(strings.ToLower(originalName), "..") {
		return fmt.Errorf("nome de arquivo inválido")
	}
	mimeOK := false
	if declaredMIME != "" {
		_, mimeOK = p.AllowedMimeTypes[strings.ToLower(declaredMIME)]
	}
	extOK := false
	if _, ok := p.AllowedExtensions[ext]; ok {
		extOK = true
	}
	if !mimeOK && !extOK {
		return fmt.Errorf("tipo de arquivo não permitido")
	}
	return nil
}

func (p UploadPolicy) ResolveMIME(originalName, declaredMIME string) string {
	if declaredMIME != "" {
		return strings.ToLower(declaredMIME)
	}
	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(originalName), "."))
	switch ext {
	case "jpg", "jpeg":
		return "image/jpeg"
	case "png":
		return "image/png"
	case "webp":
		return "image/webp"
	case "txt":
		return "text/plain"
	case "csv":
		return "text/csv"
	case "xls":
		return "application/vnd.ms-excel"
	case "xlsx":
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case "doc":
		return "application/msword"
	case "docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case "pdf":
		return "application/pdf"
	default:
		if mt := mime.TypeByExtension("." + ext); mt != "" {
			return mt
		}
		return "application/octet-stream"
	}
}

func splitCSVEnv(raw string, fallback []string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return append([]string(nil), fallback...)
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		return append([]string(nil), fallback...)
	}
	return out
}

func SanitizeOriginalFilename(name string) string {
	base := filepath.Base(name)
	ext := filepath.Ext(base)
	stem := strings.TrimSuffix(base, ext)
	var b strings.Builder
	for _, r := range stem {
		switch {
		case r >= 'a' && r <= 'z', r >= 'A' && r <= 'Z', r >= '0' && r <= '9':
			b.WriteRune(r)
		case r == '-', r == '_', r == '.':
			b.WriteRune(r)
		default:
			b.WriteRune('_')
		}
	}
	slug := strings.Trim(b.String(), "._")
	if slug == "" {
		slug = "arquivo"
	}
	if len(slug) > 80 {
		slug = slug[:80]
	}
	return slug + strings.ToLower(ext)
}
