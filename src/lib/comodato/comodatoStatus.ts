import { isBefore, isValid, parse, parseISO, startOfDay } from 'date-fns';

export type ComodatoStatusInput = {
  status: string;
  data_devolucao_prevista?: string;
};

/** Interpreta ISO (yyyy-MM-dd), BR (dd/MM/yyyy) ou timestamp. */
export function parseDevolucaoPrevista(value?: string): Date | null {
  if (!value?.trim()) {
    return null;
  }
  const trimmed = value.trim();

  const isoPart = trimmed.slice(0, 10);
  const fromIso = parseISO(isoPart);
  if (isValid(fromIso)) {
    return startOfDay(fromIso);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoPart)) {
    const fromBr = parse(isoPart, 'dd/MM/yyyy', new Date());
    if (isValid(fromBr)) {
      return startOfDay(fromBr);
    }
  }

  const fallback = new Date(trimmed);
  if (isValid(fallback)) {
    return startOfDay(fallback);
  }

  return null;
}

export function isComodatoDevolvido(c: { status: string }): boolean {
  return c.status === 'Devolvido';
}

export function isComodatoAtrasado(
  c: ComodatoStatusInput,
  refDate: Date = startOfDay(new Date()),
): boolean {
  if (isComodatoDevolvido(c)) {
    return false;
  }

  const due = parseDevolucaoPrevista(c.data_devolucao_prevista);
  if (due && isBefore(due, refDate)) {
    return true;
  }

  // Compatível com registros que já gravaram status explícito
  return c.status === 'Atrasado';
}

export function isComodatoAtivo(
  c: ComodatoStatusInput,
  refDate: Date = startOfDay(new Date()),
): boolean {
  return !isComodatoDevolvido(c) && !isComodatoAtrasado(c, refDate);
}

export function getComodatoStatusLabel(c: ComodatoStatusInput): string {
  if (isComodatoDevolvido(c)) {
    return 'Devolvido';
  }
  if (isComodatoAtrasado(c)) {
    return 'Atrasado';
  }
  if (c.status === 'Ativo') {
    return 'Ativo';
  }
  return 'Emprestado';
}

export function partitionComodatos<T extends ComodatoStatusInput>(
  list: T[],
  refDate: Date = startOfDay(new Date()),
) {
  // Não passar isComodatoAtivo/isComodatoAtrasado direto ao .filter(): o 2º arg do callback é o índice.
  return {
    ativos: list.filter((c) => isComodatoAtivo(c, refDate)),
    atrasados: list.filter((c) => isComodatoAtrasado(c, refDate)),
    devolvidos: list.filter((c) => isComodatoDevolvido(c)),
  };
}
