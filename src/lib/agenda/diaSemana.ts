/** Slugs usados em useAgendaConflicts e ProfissionalForm (segunda … domingo). */
export const DIAS_SEMANA_SLUGS = [
  'domingo',
  'segunda',
  'terca',
  'quarta',
  'quinta',
  'sexta',
  'sabado',
] as const;

export type DiaSemanaSlug = (typeof DIAS_SEMANA_SLUGS)[number];

const TO_SLUG: Record<string, DiaSemanaSlug> = {
  domingo: 'domingo',
  dom: 'domingo',
  '0': 'domingo',
  segunda: 'segunda',
  seg: 'segunda',
  '1': 'segunda',
  terca: 'terca',
  terça: 'terca',
  ter: 'terca',
  '2': 'terca',
  quarta: 'quarta',
  qua: 'quarta',
  '3': 'quarta',
  quinta: 'quinta',
  qui: 'quinta',
  '4': 'quinta',
  sexta: 'sexta',
  sex: 'sexta',
  '5': 'sexta',
  sabado: 'sabado',
  sábado: 'sabado',
  sab: 'sabado',
  '6': 'sabado',
};

/** Normaliza valor de cadastro/API/legado para slug do verificador de agenda. */
export function normalizeDiaSemana(value: string): DiaSemanaSlug | null {
  const key = value.trim().toLowerCase();
  return TO_SLUG[key] ?? null;
}

export function normalizeDiasAtendimento(dias: string[]): DiaSemanaSlug[] {
  const out = new Set<DiaSemanaSlug>();
  for (const d of dias) {
    const slug = normalizeDiaSemana(d);
    if (slug) out.add(slug);
  }
  return [...out];
}

export function slugFromDate(date: Date): DiaSemanaSlug {
  return DIAS_SEMANA_SLUGS[date.getDay()];
}

/** API Postgres dia_semana enum → slug do frontend. */
export const DIA_API_TO_SLUG: Record<string, DiaSemanaSlug> = {
  dom: 'domingo',
  seg: 'segunda',
  ter: 'terca',
  qua: 'quarta',
  qui: 'quinta',
  sex: 'sexta',
  sab: 'sabado',
};
