import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PendenciasDocumentosModal } from './PendenciasDocumentosModal';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Tester', email: 't@x', role: 'gestor' },
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const uploadAsync = vi.fn();
const ativosPorCategoria = vi.fn(() => [] as never[]);

vi.mock('@/hooks/useProfissionalDocumentos', () => ({
  useProfissionalDocumentos: () => ({
    ativosPorCategoria,
    uploadAsync,
    download: vi.fn(),
  }),
  PROFISSIONAL_DOCS_OBRIGATORIOS: ['documento_pessoal', 'registro_profissional'],
  DOCUMENTO_CATEGORIA_LABEL: {
    documento_pessoal: 'Documento pessoal (RG/CPF)',
    registro_profissional: 'Registro profissional',
  },
}));

vi.mock('@/hooks/useAuditLog', () => ({
  useAuditLog: () => ({ log: vi.fn() }),
}));

const PROF_ID = 'prof-1';

describe('PendenciasDocumentosModal', () => {
  it('lista os documentos obrigatórios e marca todos como pendentes inicialmente', () => {
    ativosPorCategoria.mockReturnValue([]);
    render(
      <PendenciasDocumentosModal
        isOpen
        onClose={() => {}}
        profissionalId={PROF_ID}
        profissionalNome="Dr. Teste"
      />,
    );
    expect(screen.getByText(/Documento pessoal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Pendente/i).length).toBeGreaterThanOrEqual(2);
  });

  it('exibe nome longo truncado e mantém botão Atualizar visível', async () => {
    const longName = 'a'.repeat(120) + '.pdf';
    uploadAsync.mockResolvedValue({
      id: 'd1',
      profissionalId: PROF_ID,
      categoria: 'documento_pessoal',
      obrigatorio: true,
      nomeArquivo: longName,
      mimeType: 'application/pdf',
      tamanhoBytes: 8,
      versao: 1,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'u1',
    });
    ativosPorCategoria.mockImplementation((_pid, cat) =>
      cat === 'documento_pessoal'
        ? [
            {
              id: 'd1',
              profissionalId: PROF_ID,
              categoria: 'documento_pessoal',
              obrigatorio: true,
              nomeArquivo: longName,
              mimeType: 'application/pdf',
              tamanhoBytes: 8,
              versao: 1,
              uploadedAt: new Date().toISOString(),
              uploadedBy: 'u1',
            },
          ]
        : [],
    );

    render(
      <PendenciasDocumentosModal isOpen onClose={() => {}} profissionalId={PROF_ID} />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /Enviar/i })[0]);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(['x'], longName, { type: 'application/pdf' })] },
    });

    await waitFor(() => {
      expect(uploadAsync).toHaveBeenCalled();
    });

    const nomeBtn = screen.getByTitle(longName);
    expect(nomeBtn.className).toMatch(/truncate/);
    expect(screen.getByRole('button', { name: /Atualizar/i })).toBeInTheDocument();
  });

  it('com documento já enviado, nome longo truncado e botão Atualizar visível', () => {
    const longName =
      '_Folha de Reunião EXECUTIVO - Frente Equipes 35-.pdf';
    ativosPorCategoria.mockImplementation((_pid, cat) =>
      cat === 'documento_pessoal'
        ? [
            {
              id: 'd1',
              profissionalId: PROF_ID,
              categoria: 'documento_pessoal',
              obrigatorio: true,
              nomeArquivo: longName,
              mimeType: 'application/pdf',
              tamanhoBytes: 8,
              versao: 1,
              uploadedAt: new Date().toISOString(),
              uploadedBy: 'u1',
            },
          ]
        : [],
    );

    render(
      <PendenciasDocumentosModal isOpen onClose={() => {}} profissionalId={PROF_ID} />,
    );

    const nomeBtn = screen.getByTitle(longName);
    expect(nomeBtn.className).toMatch(/truncate/);
    expect(screen.getByRole('button', { name: /Atualizar/i })).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
  });
});
