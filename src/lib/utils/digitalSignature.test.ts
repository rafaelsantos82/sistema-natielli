import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateICPBrasil,
  isCertificateValid,
  verifySignature,
  getSignedDocuments,
  saveSignedDocument,
  signDocument,
  addSignatureVisualizationToPDF,
} from '@/lib/utils/digitalSignature';
import {
  createMockPdfBytes,
  createTestCertificate,
  signMockDocument,
} from '@/test/fixtures/signatureFixtures';

const STORAGE_KEY = 'signed_documents';

describe('digitalSignature', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('certificado de teste passa validação ICP-Brasil e validade', () => {
    const { certificate } = createTestCertificate();
    expect(validateICPBrasil(certificate)).toBe(true);
    expect(isCertificateValid(certificate)).toBe(true);
  });

  it('assina e verifica documento mock', async () => {
    const pdfBytes = await createMockPdfBytes('Doc Teste', 'Subtitle');
    const { certificate, privateKey } = createTestCertificate();
    const signatureData = await signDocument(pdfBytes, certificate, privateKey);
    const result = await verifySignature(pdfBytes, signatureData);
    expect(result.valid).toBe(true);
    expect(result.message).toBe('Assinatura válida');
  });

  it('PDF assinado inclui camada de visualização (tamanho maior que o original)', async () => {
    const pdfBytes = await createMockPdfBytes('Visualização');
    const { certificate, privateKey } = createTestCertificate();
    const signatureData = await signDocument(pdfBytes, certificate, privateKey);
    const signed = await addSignatureVisualizationToPDF(pdfBytes, signatureData);
    expect(signed.length).toBeGreaterThan(pdfBytes.length);
    expect(signed.subarray(0, 5)).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])); // %PDF-
  });

  it('persiste e recupera documentos assinados do localStorage', async () => {
    const pdfBytes = await createMockPdfBytes('Persistência');
    const id = await signMockDocument(pdfBytes, 'prontuario', 'mock-persist');
    const docs = getSignedDocuments();
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe(id);
    expect(docs[0].name).toBe('mock-persist');
    expect(docs[0].originalDocument).toEqual(pdfBytes);
    expect(docs[0].createdAt).toBeInstanceOf(Date);
  });

  it('detecta alteração no documento original após assinatura', async () => {
    const pdfBytes = await createMockPdfBytes('Integridade');
    const { certificate, privateKey } = createTestCertificate();
    const signatureData = await signDocument(pdfBytes, certificate, privateKey);
    const tampered = new Uint8Array(pdfBytes);
    tampered[0] = tampered[0] === 0 ? 1 : 0;
    const result = await verifySignature(tampered, signatureData);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('modificado');
  });

  it('roundtrip save/get mantém verificação válida no original', async () => {
    const pdfBytes = await createMockPdfBytes('Roundtrip');
    const { certificate, privateKey } = createTestCertificate();
    const signatureData = await signDocument(pdfBytes, certificate, privateKey);
    const signedDocument = await addSignatureVisualizationToPDF(pdfBytes, signatureData);
    saveSignedDocument({
      name: 'roundtrip-doc',
      originalDocument: pdfBytes,
      signedDocument,
      signatureData,
      type: 'atestado',
    });
    const [stored] = getSignedDocuments();
    const result = await verifySignature(stored.originalDocument, stored.signatureData);
    expect(result.valid).toBe(true);
  });
});
