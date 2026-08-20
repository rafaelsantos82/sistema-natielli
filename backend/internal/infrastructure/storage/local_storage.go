package storage

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

type LocalStorage struct {
	basePath string
}

func NewLocalStorage(basePath string) (*LocalStorage, error) {
	basePath = strings.TrimSpace(basePath)
	if basePath == "" {
		basePath = "/data/uploads"
	}
	abs, err := filepath.Abs(basePath)
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(abs, 0o750); err != nil {
		return nil, fmt.Errorf("criar diretório de upload: %w", err)
	}
	return &LocalStorage{basePath: abs}, nil
}

func (s *LocalStorage) BasePath() string { return s.basePath }

func (s *LocalStorage) StoreProfissionalDocument(
	profissionalID uuid.UUID,
	categoria string,
	documentoID uuid.UUID,
	safeFilename string,
	reader io.Reader,
) (relativePath string, written int64, err error) {
	rel := filepath.ToSlash(filepath.Join(
		"profissionais",
		profissionalID.String(),
		categoria,
		fmt.Sprintf("%s_%s", documentoID.String(), safeFilename),
	))
	full := filepath.Join(s.basePath, filepath.FromSlash(rel))
	if err := os.MkdirAll(filepath.Dir(full), 0o750); err != nil {
		return "", 0, err
	}
	cleanFull := filepath.Clean(full)
	cleanBase := filepath.Clean(s.basePath)
	if !strings.HasPrefix(cleanFull, cleanBase+string(os.PathSeparator)) && cleanFull != cleanBase {
		return "", 0, fmt.Errorf("caminho de armazenamento inválido")
	}
	f, err := os.OpenFile(cleanFull, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o640)
	if err != nil {
		return "", 0, err
	}
	defer f.Close()
	n, err := io.Copy(f, reader)
	if err != nil {
		_ = os.Remove(cleanFull)
		return "", 0, err
	}
	return rel, n, nil
}

func (s *LocalStorage) StoreContratoArquivo(
	contratoID uuid.UUID,
	safeFilename string,
	reader io.Reader,
) (relativePath string, written int64, err error) {
	rel := filepath.ToSlash(filepath.Join(
		"contratos",
		contratoID.String(),
		fmt.Sprintf("%s_%s", contratoID.String(), safeFilename),
	))
	full := filepath.Join(s.basePath, filepath.FromSlash(rel))
	if err := os.MkdirAll(filepath.Dir(full), 0o750); err != nil {
		return "", 0, err
	}
	cleanFull := filepath.Clean(full)
	cleanBase := filepath.Clean(s.basePath)
	if !strings.HasPrefix(cleanFull, cleanBase+string(os.PathSeparator)) && cleanFull != cleanBase {
		return "", 0, fmt.Errorf("caminho de armazenamento inválido")
	}
	f, err := os.OpenFile(cleanFull, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o640)
	if err != nil {
		return "", 0, err
	}
	defer f.Close()
	n, err := io.Copy(f, reader)
	if err != nil {
		_ = os.Remove(cleanFull)
		return "", 0, err
	}
	return rel, n, nil
}

func (s *LocalStorage) StoreBibliotecaArquivo(
	categoriaID uuid.UUID,
	documentoID uuid.UUID,
	safeFilename string,
	reader io.Reader,
) (relativePath string, written int64, err error) {
	rel := filepath.ToSlash(filepath.Join(
		"biblioteca",
		categoriaID.String(),
		fmt.Sprintf("%s_%s", documentoID.String(), safeFilename),
	))
	full := filepath.Join(s.basePath, filepath.FromSlash(rel))
	if err := os.MkdirAll(filepath.Dir(full), 0o750); err != nil {
		return "", 0, err
	}
	cleanFull := filepath.Clean(full)
	cleanBase := filepath.Clean(s.basePath)
	if !strings.HasPrefix(cleanFull, cleanBase+string(os.PathSeparator)) && cleanFull != cleanBase {
		return "", 0, fmt.Errorf("caminho de armazenamento inválido")
	}
	f, err := os.OpenFile(cleanFull, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o640)
	if err != nil {
		return "", 0, err
	}
	defer f.Close()
	n, err := io.Copy(f, reader)
	if err != nil {
		_ = os.Remove(cleanFull)
		return "", 0, err
	}
	return rel, n, nil
}

func (s *LocalStorage) StoreMarketingManual(
	manualID uuid.UUID,
	safeFilename string,
	reader io.Reader,
) (relativePath string, written int64, err error) {
	return s.storeMarketingFile("manuais", manualID, safeFilename, reader)
}

func (s *LocalStorage) StoreMarketingMaterial(
	materialID uuid.UUID,
	safeFilename string,
	reader io.Reader,
) (relativePath string, written int64, err error) {
	return s.storeMarketingFile("materiais", materialID, safeFilename, reader)
}

func (s *LocalStorage) storeMarketingFile(
	kind string,
	entityID uuid.UUID,
	safeFilename string,
	reader io.Reader,
) (relativePath string, written int64, err error) {
	rel := filepath.ToSlash(filepath.Join(
		"marketing",
		kind,
		fmt.Sprintf("%s_%s", entityID.String(), safeFilename),
	))
	full := filepath.Join(s.basePath, filepath.FromSlash(rel))
	if err := os.MkdirAll(filepath.Dir(full), 0o750); err != nil {
		return "", 0, err
	}
	cleanFull := filepath.Clean(full)
	cleanBase := filepath.Clean(s.basePath)
	if !strings.HasPrefix(cleanFull, cleanBase+string(os.PathSeparator)) && cleanFull != cleanBase {
		return "", 0, fmt.Errorf("caminho de armazenamento inválido")
	}
	f, err := os.OpenFile(cleanFull, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o640)
	if err != nil {
		return "", 0, err
	}
	defer f.Close()
	n, err := io.Copy(f, reader)
	if err != nil {
		_ = os.Remove(cleanFull)
		return "", 0, err
	}
	return rel, n, nil
}

func (s *LocalStorage) RemoveRelative(relativePath string) error {
	if strings.TrimSpace(relativePath) == "" {
		return nil
	}
	rel := filepath.FromSlash(strings.TrimPrefix(relativePath, "/"))
	full := filepath.Join(s.basePath, rel)
	clean := filepath.Clean(full)
	cleanBase := filepath.Clean(s.basePath)
	if !strings.HasPrefix(clean, cleanBase+string(os.PathSeparator)) && clean != cleanBase {
		return fmt.Errorf("acesso negado ao arquivo")
	}
	if err := os.Remove(clean); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (s *LocalStorage) StoreDocumentoAssinado(
	unidadeID uuid.UUID,
	documentoID uuid.UUID,
	kind string,
	safeFilename string,
	reader io.Reader,
) (relativePath string, written int64, err error) {
	rel := filepath.ToSlash(filepath.Join(
		"assinaturas",
		unidadeID.String(),
		documentoID.String(),
		fmt.Sprintf("%s_%s", kind, safeFilename),
	))
	full := filepath.Join(s.basePath, filepath.FromSlash(rel))
	if err := os.MkdirAll(filepath.Dir(full), 0o750); err != nil {
		return "", 0, err
	}
	cleanFull := filepath.Clean(full)
	cleanBase := filepath.Clean(s.basePath)
	if !strings.HasPrefix(cleanFull, cleanBase+string(os.PathSeparator)) && cleanFull != cleanBase {
		return "", 0, fmt.Errorf("caminho de armazenamento inválido")
	}
	f, err := os.OpenFile(cleanFull, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o640)
	if err != nil {
		return "", 0, err
	}
	defer f.Close()
	n, err := io.Copy(f, reader)
	if err != nil {
		_ = os.Remove(cleanFull)
		return "", 0, err
	}
	return rel, n, nil
}

func (s *LocalStorage) OpenRelative(relativePath string) (*os.File, error) {
	rel := filepath.FromSlash(strings.TrimPrefix(relativePath, "/"))
	full := filepath.Join(s.basePath, rel)
	clean := filepath.Clean(full)
	cleanBase := filepath.Clean(s.basePath)
	if !strings.HasPrefix(clean, cleanBase+string(os.PathSeparator)) && clean != cleanBase {
		return nil, fmt.Errorf("acesso negado ao arquivo")
	}
	return os.Open(clean)
}
