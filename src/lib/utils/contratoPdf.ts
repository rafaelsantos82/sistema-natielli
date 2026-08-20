import { jsPDF } from 'jspdf';

/** Gera PDF simples a partir do texto do contrato (fase ICP / chave da unidade). */
export function getContratoPDFBytes(titulo: string, conteudo: string): Uint8Array {
  const doc = new jsPDF();
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
  doc.setFontSize(14);
  doc.text(titulo, margin, 20);
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(conteudo || '', pageWidth);
  doc.text(lines, margin, 30);
  return new Uint8Array(doc.output('arraybuffer'));
}
