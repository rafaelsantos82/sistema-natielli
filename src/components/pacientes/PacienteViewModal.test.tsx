import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PacienteViewModal } from './PacienteViewModal';
import type { PacienteFormData } from '@/lib/validations/paciente.schema';
import type { PacienteListRow } from '@/hooks/usePacientes';

const mockRow: PacienteListRow = {
  id: 'pac-1',
  nome: 'Ana Souza',
  cpf: '12345678900',
  data_nascimento: '2012-05-10',
  dataNasc: '10/05/2012',
  telefone: '(11) 99999-9999',
  email: 'ana@email.com',
  status: 'ativo',
  proximaConsulta: '01/06/2026 10:00',
  ultimaConsulta: '20/05/2026 09:00',
  totalConsultas: 8,
};

const mockForm: PacienteFormData = {
  nome_completo: 'Ana Souza',
  nome_social: '',
  data_nascimento: '2012-05-10',
  sexo_biologico: 'feminino',
  cpf: '12345678900',
  rg_numero: '',
  rg_orgao: '',
  foto: '',
  tel_principal: '(11) 99999-9999',
  tel_secundario: '',
  email: 'ana@email.com',
  endereco: 'Rua A',
  numero: '10',
  complemento: '',
  bairro: 'Centro',
  cidade: 'São Paulo',
  uf: 'SP',
  cep: '01001000',
  contato_emergencia_nome: '',
  contato_emergencia_tel: '',
  responsavel_nome: 'Maria Souza',
  responsavel_cpf: '',
  responsavel_parentesco: 'Mãe',
  responsavel_tel: '(11) 98888-8888',
  responsavel_email: '',
  pessoas_autorizadas_busca: ['Carlos Souza'],
  escola: 'Escola Azul',
  serie_ano: '5º ano',
  necessidades_especiais: '',
  pediatra_referencia: '',
  altura: 140,
  peso: 40,
  tipo_sanguineo: 'O+',
  alergias: '',
  doencas_cronicas: '',
  medicacoes_continuo: '',
  cirurgias_previas: '',
  historico_familiar: '',
  vacinas: [],
  observacoes: 'Paciente colaborativa.',
  atividade_fisica_frequencia: '',
  atividade_fisica_tipo: '',
  alimentacao: '',
  sono_horas: 8,
  status: 'ativo',
  consentimento_lgpd: true,
  autorizacao_uso_imagem: false,
  assinatura_digital: '',
  documentos_anexos: [],
};

describe('PacienteViewModal', () => {
  it('renderiza modal e seções read-only', () => {
    render(
      <PacienteViewModal
        isOpen
        onClose={() => {}}
        listRow={mockRow}
        formData={mockForm}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByText('Ana Souza').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Identificação/i)).toBeInTheDocument();
    expect(screen.getByText(/Endereço e contato/i)).toBeInTheDocument();
    expect(screen.getByText(/Status e observações/i)).toBeInTheDocument();
  });

  it('chama onEdit ao clicar em Editar', () => {
    const onEdit = vi.fn();
    render(
      <PacienteViewModal
        isOpen
        onClose={() => {}}
        listRow={mockRow}
        formData={mockForm}
        onEdit={onEdit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Editar/i }));
    expect(onEdit).toHaveBeenCalledWith(mockRow);
  });
});

