package database

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

type JSONB []byte

func (j JSONB) Value() (driver.Value, error) {
	if len(j) == 0 {
		return []byte("[]"), nil
	}
	return []byte(j), nil
}

func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = []byte("[]")
		return nil
	}
	switch v := value.(type) {
	case []byte:
		*j = append((*j)[0:0], v...)
		return nil
	case string:
		*j = []byte(v)
		return nil
	default:
		return fmt.Errorf("jsonb: unsupported type %T", value)
	}
}

func marshalJSON(v any) (JSONB, error) {
	b, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	return JSONB(b), nil
}

func unmarshalJSON[T any](j JSONB, out *T) error {
	if len(j) == 0 {
		return json.Unmarshal([]byte("[]"), out)
	}
	return json.Unmarshal(j, out)
}
