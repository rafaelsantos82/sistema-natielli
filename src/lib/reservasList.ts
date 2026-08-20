import type { Reserva } from '@/hooks/useSalas';

/** Garante valor usável como lista de reservas (evita .filter em Promise/objeto). */
export function asReservaList(value: unknown): Reserva[] {
  if (Array.isArray(value)) {
    return value as Reserva[];
  }
  return [];
}
