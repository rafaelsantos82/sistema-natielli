import { useState, useEffect } from 'react';
import { usePacientesList } from '@/hooks/usePacientes';

export interface Aniversariante {
  id: string;
  nome: string;
  tipo: 'Paciente' | 'Colaborador';
  data_nascimento: string;
  foto_url?: string;
  telefone?: string;
  email?: string;
  unidade?: string;
}

const STORAGE_KEY = 'aniversariantes';

export const useAniversariantes = () => {
  const { data: pacientesData } = usePacientesList('', 1, 500);

  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(aniversariantes));
  }, [aniversariantes]);

  const getAniversariantesDoMes = (mes?: number) => {
    const targetMes = mes ?? new Date().getMonth() + 1;

    return aniversariantes.filter((aniv) => {
      const data = new Date(aniv.data_nascimento);
      return data.getMonth() + 1 === targetMes;
    }).sort((a, b) => {
      const diaA = new Date(a.data_nascimento).getDate();
      const diaB = new Date(b.data_nascimento).getDate();
      return diaA - diaB;
    });
  };

  const getAniversariantesPorTipo = (tipo: 'Paciente' | 'Colaborador', mes?: number) => {
    const targetMes = mes ?? new Date().getMonth() + 1;
    if (tipo === 'Paciente') {
      const rows = pacientesData?.rows ?? [];
      return rows
        .filter((p) => {
          if (!p.data_nascimento) return false;
          const d = new Date(p.data_nascimento);
          return d.getMonth() + 1 === targetMes;
        })
        .map((p) => ({
          id: p.id,
          nome: p.nome,
          tipo: 'Paciente' as const,
          data_nascimento: p.data_nascimento,
          telefone: p.telefone,
          email: p.email !== '—' ? p.email : undefined,
        }))
        .sort(
          (a, b) =>
            new Date(a.data_nascimento).getDate() -
            new Date(b.data_nascimento).getDate()
        );
    }
    const aniversariantesDoMes = getAniversariantesDoMes(mes);
    return aniversariantesDoMes.filter((aniv) => aniv.tipo === tipo);
  };

  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();

    if (
      mesAtual < mesNascimento ||
      (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())
    ) {
      idade--;
    }

    return idade;
  };

  return {
    aniversariantes,
    getAniversariantesDoMes,
    getAniversariantesPorTipo,
    calcularIdade,
  };
};
