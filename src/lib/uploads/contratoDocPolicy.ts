export const CONTRATO_DOC_MAX_BYTES = 10 * 1024 * 1024;

export const CONTRATO_DOC_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const;

export const CONTRATO_DOC_ACCEPT = [
  ...CONTRATO_DOC_EXTENSIONS,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
].join(',');

export const CONTRATO_DOC_ALLOWED_LABEL = 'PDF ou Word (DOC, DOCX) — até 10 MB';

const EXT_MIME: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

export function resolveContratoDocMime(file: File): string {
  if (file.type) return file.type.toLowerCase();
  const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : '';
  if (ext && EXT_MIME[ext]?.[0]) return EXT_MIME[ext][0];
  return '';
}

export function validateContratoDocFile(file: File): void {
  if (file.size > CONTRATO_DOC_MAX_BYTES) {
    throw new Error('Arquivo excede 10 MB.');
  }
  const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : '';
  const mime = resolveContratoDocMime(file);
  const extOk = ext && Object.prototype.hasOwnProperty.call(EXT_MIME, ext);
  const mimeOk = mime && Object.values(EXT_MIME).some((list) => list.includes(mime));
  if (!extOk && !mimeOk) {
    throw new Error('Tipo de arquivo não permitido. Use PDF ou Word (DOC, DOCX).');
  }
}
