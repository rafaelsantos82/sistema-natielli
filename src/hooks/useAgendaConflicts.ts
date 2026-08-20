import { useMemo } from 'react';
import { isSameDay, addDays, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { normalizeDiasAtendimento, slugFromDate } from '@/lib/agenda/diaSemana';
import { normalizeTime } from '@/lib/agenda/profissionalSchedule';

export interface AgendaException {
  id: string;
  date: Date;
  type: 'ferias' | 'almoco' | 'exception';
  startTime?: string;
  endTime?: string;
  description: string;
  recurrence?: {
    type: 'none' | 'weekly' | 'monthly_date' | 'monthly_first_weekday';
    interval: number;
    endDate?: Date;
  };
}

interface ConflictCheck {
  date: Date;
  startTime: string;
  endTime: string;
}

interface ConflictResult {
  hasConflict: boolean;
  conflicts: Array<{
    type: string;
    description: string;
    time?: string;
  }>;
}

export interface ProfissionalScheduleInput {
  diasAtendimento: string[];
  horarioInicio: string;
  horarioFim: string;
  missingAttendanceDays?: boolean;
}

const parseTime = (dateStr: Date, timeStr: string): Date => {
  const normalized = normalizeTime(timeStr);
  const [hours, minutes] = normalized.split(':').map(Number);
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const generateRecurrenceInstances = (
  exception: AgendaException,
  startDate: Date,
  endDate: Date
): Date[] => {
  if (!exception.recurrence || exception.recurrence.type === 'none') {
    return [exception.date];
  }

  const instances: Date[] = [];
  const recurrence = exception.recurrence;
  let currentDate = new Date(exception.date);

  while (currentDate <= endDate) {
    if (currentDate >= startDate) {
      instances.push(new Date(currentDate));
    }

    switch (recurrence.type) {
      case 'weekly':
        currentDate = addDays(currentDate, 7 * recurrence.interval);
        break;

      case 'monthly_date':
        currentDate = addMonths(currentDate, recurrence.interval);
        break;

      case 'monthly_first_weekday': {
        currentDate = addMonths(currentDate, recurrence.interval);
        const monthStart = startOfMonth(currentDate);
        let firstWeekday = monthStart;
        while (firstWeekday.getDay() === 0 || firstWeekday.getDay() === 6) {
          firstWeekday = addDays(firstWeekday, 1);
        }
        currentDate = firstWeekday;
        break;
      }
    }

    if (recurrence.endDate && currentDate > recurrence.endDate) {
      break;
    }
  }

  return instances;
};

export const useAgendaConflicts = (
  exceptions: AgendaException[],
  profissionalSchedule?: ProfissionalScheduleInput
) => {
  const diasNormalizados = useMemo(
    () => normalizeDiasAtendimento(profissionalSchedule?.diasAtendimento ?? []),
    [profissionalSchedule?.diasAtendimento],
  );

  const checkConflict = useMemo(() => {
    return (check: ConflictCheck): ConflictResult => {
      const conflicts: Array<{ type: string; description: string; time?: string }> = [];

      if (profissionalSchedule) {
        if (profissionalSchedule.missingAttendanceDays || diasNormalizados.length === 0) {
          // Aviso exibido no ConflictChecker (banner); evita mensagem duplicada na lista.
        } else {
          const dayName = slugFromDate(check.date);
          if (!diasNormalizados.includes(dayName)) {
            conflicts.push({
              type: 'no_attendance',
              description: 'Profissional não atende neste dia da semana',
            });
          }
        }

        const scheduleStart = parseTime(
          check.date,
          profissionalSchedule.horarioInicio,
        );
        const scheduleEnd = parseTime(check.date, profissionalSchedule.horarioFim);
        const checkStart = parseTime(check.date, check.startTime);
        const checkEnd = parseTime(check.date, check.endTime);

        if (checkStart < scheduleStart || checkEnd > scheduleEnd) {
          conflicts.push({
            type: 'outside_hours',
            description: 'Horário fora do expediente do profissional',
            time: `${normalizeTime(profissionalSchedule.horarioInicio)} - ${normalizeTime(profissionalSchedule.horarioFim)}`,
          });
        }
      }

      const today = new Date();
      const futureDate = addMonths(today, 12);

      exceptions.forEach((exception) => {
        const instances = generateRecurrenceInstances(exception, today, futureDate);

        instances.forEach((instanceDate) => {
          if (!isSameDay(instanceDate, check.date)) {
            return;
          }

          if (exception.type === 'ferias') {
            conflicts.push({
              type: 'ferias',
              description: exception.description || 'Profissional de férias',
            });
            return;
          }

          if (exception.startTime && exception.endTime) {
            const exceptionStart = parseTime(check.date, exception.startTime);
            const exceptionEnd = parseTime(check.date, exception.endTime);
            const checkStart = parseTime(check.date, check.startTime);
            const checkEnd = parseTime(check.date, check.endTime);

            const hasOverlap =
              (checkStart >= exceptionStart && checkStart < exceptionEnd) ||
              (checkEnd > exceptionStart && checkEnd <= exceptionEnd) ||
              (checkStart <= exceptionStart && checkEnd >= exceptionEnd);

            if (hasOverlap) {
              conflicts.push({
                type: exception.type,
                description: exception.description,
                time: `${exception.startTime} - ${exception.endTime}`,
              });
            }
          }
        });
      });

      return {
        hasConflict: conflicts.length > 0,
        conflicts,
      };
    };
  }, [exceptions, profissionalSchedule, diasNormalizados]);

  const getAvailableSlots = useMemo(() => {
    return (date: Date, slotDuration: number = 60): Array<{ start: string; end: string }> => {
      if (!profissionalSchedule) return [];

      const dayName = slugFromDate(date);

      if (
        profissionalSchedule.missingAttendanceDays ||
        diasNormalizados.length === 0 ||
        !diasNormalizados.includes(dayName)
      ) {
        return [];
      }

      const today = new Date();
      const futureDate = addMonths(today, 12);

      for (const exception of exceptions) {
        const instances = generateRecurrenceInstances(exception, today, futureDate);
        if (instances.some((inst) => isSameDay(inst, date)) && exception.type === 'ferias') {
          return [];
        }
      }

      const slots: Array<{ start: string; end: string }> = [];
      const horarioInicio = normalizeTime(profissionalSchedule.horarioInicio);
      const horarioFim = normalizeTime(profissionalSchedule.horarioFim);
      const [startHour, startMinute] = horarioInicio.split(':').map(Number);
      const [endHour, endMinute] = horarioFim.split(':').map(Number);

      let currentTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      while (currentTime + slotDuration <= endTime) {
        const slotStart = `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(currentTime % 60).padStart(2, '0')}`;
        const slotEnd = `${String(Math.floor((currentTime + slotDuration) / 60)).padStart(2, '0')}:${String((currentTime + slotDuration) % 60).padStart(2, '0')}`;

        const conflict = checkConflict({
          date,
          startTime: slotStart,
          endTime: slotEnd,
        });

        if (!conflict.hasConflict) {
          slots.push({ start: slotStart, end: slotEnd });
        }

        currentTime += slotDuration;
      }

      return slots;
    };
  }, [exceptions, profissionalSchedule, diasNormalizados, checkConflict]);

  return {
    checkConflict,
    getAvailableSlots,
    generateRecurrenceInstances,
  };
};
