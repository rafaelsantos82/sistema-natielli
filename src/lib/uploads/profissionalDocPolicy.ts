export const PROFISSIONAL_DOC_MAX_BYTES = 10 * 1024 * 1024;

export const PROFISSIONAL_DOC_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp',
  '.txt', '.csv',
  '.xls', '.xlsx',
  '.doc', '.docx',
  '.pdf',
] as const;

export const PROFISSIONAL_DOC_ACCEPT = [
  ...PROFISSIONAL_DOC_EXTENSIONS,
  'image/jpeg', 'image/png', 'image/webp',
  'text/plain', 'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf',
].join(',');

export const PROFISSIONAL_DOC_ALLOWED_LABEL =
  'imagens (JPG, PNG, WEBP), texto (TXT, CSV), Excel (XLS, XLSX), Word (DOC, DOCX) e PDF — até 10 MB';

const EXT_MIME: Record<string, string[]> = {
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
  txt: ['text/plain'],
  csv: ['text/csv'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  pdf: ['application/pdf'],
};

export function resolveProfissionalDocMime(file: File): string {
  if (file.type) return file.type.toLowerCase();
  const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : '';
  if (ext && EXT_MIME[ext]?.[0]) return EXT_MIME[ext][0];
  return '';
}

export function validateProfissionalDocFile(file: File): void {
  if (file.size > PROFISSIONAL_DOC_MAX_BYTES) {
    throw new Error('Arquivo excede 10 MB.');
  }
  const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : '';
  const mime = resolveProfissionalDocMime(file);
  const extOk = ext && Object.prototype.hasOwnProperty.call(EXT_MIME, ext);
  const mimeOk = mime && Object.values(EXT_MIME).some((list) => list.includes(mime));
  if (!extOk && !mimeOk) {
    throw new Error('Tipo de arquivo não permitido.');
  }
}
