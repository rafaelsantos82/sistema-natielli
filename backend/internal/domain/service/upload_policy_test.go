package service

import "testing"

func TestUploadPolicy_ValidateUpload(t *testing.T) {
	p := LoadUploadPolicyFromEnv()
	if err := p.ValidateUpload("rg.pdf", "application/pdf", 1024); err != nil {
		t.Fatalf("pdf: %v", err)
	}
	if err := p.ValidateUpload("planilha.xlsx", "", 1024); err != nil {
		t.Fatalf("xlsx: %v", err)
	}
	if err := p.ValidateUpload("contrato.docx", "", 1024); err != nil {
		t.Fatalf("docx: %v", err)
	}
	if err := p.ValidateUpload("virus.exe", "application/octet-stream", 1024); err == nil {
		t.Fatal("expected reject exe")
	}
}
