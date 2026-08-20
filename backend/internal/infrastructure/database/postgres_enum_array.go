package database

import (
	"database/sql/driver"
	"fmt"
	"strings"
)

// PostgresEnumArray serializa []string para arrays de ENUM do PostgreSQL (ex.: dia_semana[]).
// GORM/pgx com []string nativo envia text[] e falha no INSERT; este tipo usa literal {a,b}.
type PostgresEnumArray []string

func (a PostgresEnumArray) Value() (driver.Value, error) {
	if a == nil {
		return nil, nil
	}
	if len(a) == 0 {
		return "{}", nil
	}
	parts := make([]string, 0, len(a))
	for _, s := range a {
		s = strings.TrimSpace(s)
		if s == "" {
			continue
		}
		parts = append(parts, `"`+strings.ReplaceAll(s, `"`, `\"`)+`"`)
	}
	if len(parts) == 0 {
		return "{}", nil
	}
	return "{" + strings.Join(parts, ",") + "}", nil
}

func (a *PostgresEnumArray) Scan(value interface{}) error {
	if value == nil {
		*a = nil
		return nil
	}
	var raw string
	switch v := value.(type) {
	case string:
		raw = v
	case []byte:
		raw = string(v)
	default:
		return fmt.Errorf("postgres enum array: tipo %T não suportado", value)
	}
	raw = strings.TrimSpace(raw)
	if raw == "" || raw == "{}" {
		*a = PostgresEnumArray{}
		return nil
	}
	raw = strings.TrimPrefix(raw, "{")
	raw = strings.TrimSuffix(raw, "}")
	if raw == "" {
		*a = PostgresEnumArray{}
		return nil
	}
	parts := strings.Split(raw, ",")
	out := make(PostgresEnumArray, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		p = strings.Trim(p, `"`)
		if p != "" {
			out = append(out, p)
		}
	}
	*a = out
	return nil
}

func postgresEnumArrayFromStrings(s []string) PostgresEnumArray {
	if s == nil {
		return nil
	}
	return PostgresEnumArray(s)
}

func postgresEnumArrayToStrings(a PostgresEnumArray) []string {
	if a == nil {
		return nil
	}
	return []string(a)
}
