package seedpacientes

import "path/filepath"

// Unify merges spreadsheet files. Later files overwrite earlier ones with the same WhatsApp.
// Callers should pass older exports first (22/07) and Natielli last.
func Unify(files []struct {
	Path string
	Rows []RawRow
}) []UnifiedRecord {
	byTel := map[string]UnifiedRecord{}
	order := make([]string, 0)
	noTel := make([]UnifiedRecord, 0)

	for _, f := range files {
		src := filepath.Base(f.Path)
		for _, raw := range f.Rows {
			rec := rawToUnified(raw, src)
			if rec.TelDigits == "" {
				noTel = append(noTel, rec)
				continue
			}
			if _, exists := byTel[rec.TelDigits]; !exists {
				order = append(order, rec.TelDigits)
			}
			byTel[rec.TelDigits] = rec
		}
	}

	out := make([]UnifiedRecord, 0, len(order)+len(noTel))
	for _, tel := range order {
		out = append(out, byTel[tel])
	}
	out = append(out, noTel...)
	return out
}
