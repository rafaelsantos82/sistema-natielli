package logger

import (
	"log/slog"
	"net/url"
	"strings"
	"unicode"
)

const redacted = "[REDACTED]"

// SensitiveHeaderKeys lists HTTP headers that must never appear in logs or telemetry.
var SensitiveHeaderKeys = []string{
	"Authorization",
	"Cookie",
	"Set-Cookie",
	"X-API-Key",
	"X-Api-Key",
	"X-Bootstrap-Token",
}

// sensitiveKeyDenylist — SECURITY: LGPD/OWASP; keys matched case-insensitively (substring on normalized key).
var sensitiveKeyDenylist = []string{
	"password", "senha", "pass", "secret", "token", "access_token", "refresh_token",
	"jwt", "authorization", "cookie", "set-cookie", "api_key", "apikey", "x-api-key",
	"client_secret", "private_key", "database_url", "dsn", "connection_string",
	"cpf", "cnpj", "rg", "cnh", "card_number", "cvv", "credit_card",
	"payload", "body", "file", "attachment", "biometric", "health", "prontuario",
}

// sensitiveQueryParams — query keys always redacted in access logs.
var sensitiveQueryParams = []string{
	"token", "access_token", "refresh_token", "password", "senha", "secret",
	"api_key", "apikey", "authorization", "jwt", "cpf", "cnpj",
}

// IsSensitiveKey reports whether a log attribute key must be redacted.
func IsSensitiveKey(key string) bool {
	return matchDenylist(normalizeKey(key), sensitiveKeyDenylist)
}

// RedactValue returns a safe value for logging.
func RedactValue(key, value string) string {
	if IsSensitiveKey(key) {
		return redacted
	}
	if looksLikeJWT(value) {
		return redacted
	}
	if digitsOnly(stripNonDigits(value)) {
		switch len(stripNonDigits(value)) {
		case 11:
			return MaskCPF(value)
		case 14:
			return MaskCNPJ(value)
		}
	}
	return value
}

// RedactAttr implements slog.ReplaceAttr for global sanitization.
func RedactAttr(groups []string, attr slog.Attr) slog.Attr {
	if attr.Equal(slog.Attr{}) {
		return attr
	}
	key := attr.Key
	if len(groups) > 0 {
		key = groups[len(groups)-1] + "." + attr.Key
	}
	switch attr.Value.Kind() {
	case slog.KindString:
		attr.Value = slog.StringValue(RedactValue(key, attr.Value.String()))
	case slog.KindAny:
		// SECURITY: never expand arbitrary structs in logs — redact opaque values on sensitive keys.
		if IsSensitiveKey(key) {
			attr.Value = slog.StringValue(redacted)
		}
	}
	if IsSensitiveKey(attr.Key) && attr.Value.Kind() == slog.KindString {
		attr.Value = slog.StringValue(redacted)
	}
	return attr
}

// SanitizePath returns path and redacted query string for access logs.
func SanitizePath(rawURL string) string {
	if rawURL == "" {
		return ""
	}
	u, err := url.Parse(rawURL)
	if err != nil {
		return RedactValue("path", rawURL)
	}
	path := u.Path
	if u.RawQuery == "" {
		return path
	}
	values, err := url.ParseQuery(u.RawQuery)
	if err != nil {
		return path + "?[REDACTED]"
	}
	for key := range values {
		if isSensitiveQueryKey(key) {
			values.Set(key, redacted)
		}
	}
	return path + "?" + values.Encode()
}

// MaskIP masks IPv4 as 187.32.xxx.xxx; IPv6 keeps first segment only.
func MaskIP(ip string) string {
	ip = strings.TrimSpace(ip)
	if ip == "" {
		return ""
	}
	if strings.Contains(ip, ":") {
		parts := strings.Split(ip, ":")
		if len(parts) > 0 && parts[0] != "" {
			return parts[0] + ":****"
		}
		return redacted
	}
	parts := strings.Split(ip, ".")
	if len(parts) == 4 {
		return parts[0] + "." + parts[1] + ".xxx.xxx"
	}
	return redacted
}

// MaskEmail masks local part: ra***@domain.com
func MaskEmail(email string) string {
	email = strings.TrimSpace(email)
	at := strings.LastIndex(email, "@")
	if at <= 0 {
		return redacted
	}
	local := email[:at]
	domain := email[at:]
	if len(local) <= 2 {
		return "**" + domain
	}
	return local[:2] + "***" + domain
}

// MaskCPF keeps first 3 and last 2 digits.
func MaskCPF(v string) string {
	d := stripNonDigits(v)
	if len(d) != 11 {
		return redacted
	}
	return d[:3] + ".***.***-" + d[9:]
}

// MaskCNPJ keeps first 2 and last 2 digits.
func MaskCNPJ(v string) string {
	d := stripNonDigits(v)
	if len(d) != 14 {
		return redacted
	}
	return d[:2] + ".***.***/****-" + d[12:]
}

func normalizeKey(key string) string {
	return strings.ToLower(strings.TrimSpace(strings.ReplaceAll(key, "-", "_")))
}

func matchDenylist(normalized string, list []string) bool {
	for _, item := range list {
		if strings.Contains(normalized, item) {
			return true
		}
	}
	return false
}

func isSensitiveQueryKey(key string) bool {
	return matchDenylist(normalizeKey(key), sensitiveQueryParams)
}

func looksLikeJWT(v string) bool {
	v = strings.TrimSpace(v)
	return len(v) > 20 && strings.HasPrefix(v, "eyJ")
}

func stripNonDigits(s string) string {
	var b strings.Builder
	for _, r := range s {
		if unicode.IsDigit(r) {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func digitsOnly(s string) bool {
	if len(s) == 0 {
		return false
	}
	for _, r := range s {
		if !unicode.IsDigit(r) {
			return false
		}
	}
	return true
}
