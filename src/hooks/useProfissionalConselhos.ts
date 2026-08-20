import { useState, useEffect, useCallback } from 'react';
import type { ConselhoTipo } from './useProfissionais';

export interface ProfissionalConselho {
  id: string;
  profissionalId: string;
  tipo: ConselhoTipo;
  numero: string;
  uf: string;
  validade?: string; // ISO date
  principal: boolean;
  createdAt: string;
  updatedAt: string;
  deleted_at?: string;
}

const STORAGE_KEY = 'profissional_conselhos';

const readStored = (): ProfissionalConselho[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useProfissionalConselhos = () => {
  const [conselhos, setConselhos] = useState<ProfissionalConselho[]>([]);

  useEffect(() => {
    setConselhos(readStored());
  }, []);

  const persist = (next: ProfissionalConselho[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setConselhos(next);
  };

  const listByProfissional = useCallback(
    (profissionalId: string) =>
      conselhos.filter((c) => c.profissionalId === profissionalId && !c.deleted_at),
    [conselhos],
  );

  const add = useCallback(
    (data: Omit<ProfissionalConselho, 'id' | 'createdAt' | 'updatedAt' | 'deleted_at'>) => {
      const now = new Date().toISOString();
      const current = readStored();
      const isFirst =
        current.filter((c) => c.profissionalId === data.profissionalId && !c.deleted_at).length === 0;
      const novo: ProfissionalConselho = {
        ...data,
        principal: data.principal || isFirst,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      let next = [...current, novo];
      // Garantir único principal por profissional
      if (novo.principal) {
        next = next.map((c) =>
          c.profissionalId === novo.profissionalId && c.id !== novo.id
            ? { ...c, principal: false }
            : c,
        );
      }
      persist(next);
      return novo;
    },
    [],
  );

  const update = useCallback((id: string, patch: Partial<ProfissionalConselho>) => {
    const current = readStored();
    const target = current.find((c) => c.id === id);
    if (!target) return;
    let next = current.map((c) =>
      c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
    );
    if (patch.principal === true) {
      next = next.map((c) =>
        c.profissionalId === target.profissionalId && c.id !== id
          ? { ...c, principal: false }
          : c,
      );
    }
    persist(next);
  }, []);

  const remove = useCallback((id: string) => {
    const now = new Date().toISOString();
    const current = readStored();
    persist(current.map((c) => (c.id === id ? { ...c, deleted_at: now, updatedAt: now } : c)));
  }, []);

  const setPrincipal = useCallback((id: string) => {
    const current = readStored();
    const target = current.find((c) => c.id === id);
    if (!target) return;
    const now = new Date().toISOString();
    persist(
      current.map((c) =>
        c.profissionalId === target.profissionalId
          ? { ...c, principal: c.id === id, updatedAt: now }
          : c,
      ),
    );
  }, []);

  return { conselhos, listByProfissional, add, update, remove, setPrincipal };
};
