import { format } from 'date-fns';

interface ICSEvent {
  id: string;
  summary: string;
  description: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
}

const formatICSDate = (date: Date, allDay: boolean = false): string => {
  if (allDay) {
    return format(date, 'yyyyMMdd');
  }
  return format(date, "yyyyMMdd'T'HHmmss");
};

const escapeICSText = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

export const generateICS = (events: ICSEvent[], profissionalNome: string): string => {
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sistema de Gestão//Agenda Profissional//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Agenda - ${escapeICSText(profissionalNome)}`,
    'X-WR-TIMEZONE:America/Sao_Paulo',
  ];

  events.forEach((event) => {
    icsLines.push('BEGIN:VEVENT');
    icsLines.push(`UID:${event.id}@sistema-gestao`);
    icsLines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    
    if (event.allDay) {
      icsLines.push(`DTSTART;VALUE=DATE:${formatICSDate(event.startDate, true)}`);
      icsLines.push(`DTEND;VALUE=DATE:${formatICSDate(event.endDate, true)}`);
    } else {
      icsLines.push(`DTSTART:${formatICSDate(event.startDate)}`);
      icsLines.push(`DTEND:${formatICSDate(event.endDate)}`);
    }
    
    icsLines.push(`SUMMARY:${escapeICSText(event.summary)}`);
    icsLines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
    icsLines.push('STATUS:CONFIRMED');
    icsLines.push('TRANSP:OPAQUE');
    icsLines.push('END:VEVENT');
  });

  icsLines.push('END:VCALENDAR');

  return icsLines.join('\r\n');
};

export const downloadICS = (icsContent: string, filename: string): void => {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
