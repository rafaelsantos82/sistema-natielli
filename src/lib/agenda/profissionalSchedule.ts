import type { Profissional } from '@/hooks/useProfissionais';
import type { AgendaException } from '@/hooks/useAgendaConflicts';

export interface ProfissionalSchedule {
  diasAtendimento: string[];
  horarioInicio: string;
  horarioFim: string;
  duracaoConsulta: number;
  /** Sem dias cadastrados no profissional */
  missingAttendanceDays?: boolean;
}

/** Postgres TIME ou ISO → HH:mm para inputs e parseTime. */
export function normalizeTime(value?: string | null): string {
  if (!value?.trim()) return '08:00';
  const parts = value.trim().split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1] ?? 0);
  if (Number.isNaN(h) || Number.isNaN(m)) return '08:00';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function buildProfissionalSchedule(
  prof?: Profissional | null,
): ProfissionalSchedule | undefined {
  if (!prof) return undefined;
  const dias = prof.diasAtendimento ?? [];
  return {
    diasAtendimento: dias,
    horarioInicio: normalizeTime(prof.horarioInicio ?? '08:00'),
    horarioFim: normalizeTime(prof.horarioFim ?? '18:00'),
    duracaoConsulta: prof.duracaoConsulta ?? 60,
    missingAttendanceDays: dias.length === 0,
  };
}

/** Lê exceções de agenda (férias, almoço) do localStorage da tela Agenda do profissional. */
export function loadAgendaExceptions(profissionalId?: string): AgendaException[] {
  if (!profissionalId) return [];
  try {
    const stored = localStorage.getItem(`agenda_exceptions_${profissionalId}`);
    if (!stored) return [];
    return JSON.parse(stored, (key, value) => {
      if (key === 'date' && typeof value === 'string') return new Date(value);
      return value;
    }) as AgendaException[];
  } catch {
    return [];
  }
}

/** Parse datetime-local (YYYY-MM-DDTHH:mm) → data e horários. */
export function parseDataHoraLocal(dataHora?: string): {
  date?: Date;
  startTime?: string;
} {
  if (!dataHora?.trim()) return {};
  const d = new Date(dataHora);
  if (Number.isNaN(d.getTime())) return {};
  const startTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return { date: dateOnly, startTime };
}

export function endTimeFromStartAndDuration(
  startTime: string,
  durationMinutes: number,
): string {
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + m + durationMinutes;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}
