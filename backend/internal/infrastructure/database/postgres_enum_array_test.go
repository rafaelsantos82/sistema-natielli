package database

import (
	"testing"
)

func TestPostgresEnumArray_Value(t *testing.T) {
	t.Parallel()
	v, err := (PostgresEnumArray{"seg", "ter"}).Value()
	if err != nil {
		t.Fatal(err)
	}
	if v != `{"seg","ter"}` {
		t.Fatalf("got %v", v)
	}
}

func TestPostgresEnumArray_Scan(t *testing.T) {
	t.Parallel()
	var a PostgresEnumArray
	if err := a.Scan([]byte(`{seg,ter}`)); err != nil {
		t.Fatal(err)
	}
	if len(a) != 2 || a[0] != "seg" || a[1] != "ter" {
		t.Fatalf("got %#v", a)
	}
}
