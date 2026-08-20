import forge from 'node-forge';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import {
  addSignatureVisualizationToPDF,
  saveSignedDocument,
  signDocument,
  type SignedDocument,
} from '@/lib/utils/digitalSignature';

export const TEST_CERT_PASSWORD = 'test-sign-123';

export type MockPdfSpec = {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  documentType: SignedDocument['type'];
};

export const MOCK_PDFS: MockPdfSpec[] = [
  {
    id: 'mock-prontuario',
    name: 'mock-prontuario-paciente-teste',
    title: 'Prontuário — Paciente Teste',
    subtitle: 'Documento mock para teste de assinatura digital',
    documentType: 'prontuario',
  },
  {
    id: 'mock-prescricao',
    name: 'mock-prescricao-paciente-teste',
    title: 'Prescrição — Paciente Teste',
    subtitle: 'Receituário mock para teste de assinatura digital',
    documentType: 'prescricao',
  },
  {
    id: 'mock-atestado',
    name: 'mock-atestado-paciente-teste',
    title: 'Atestado — Paciente Teste',
    subtitle: 'Atestado mock para teste de assinatura digital',
    documentType: 'atestado',
  },
];

export async function createMockPdfBytes(
  title: string,
  subtitle = 'Gerado automaticamente para testes',
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawText(title, { x: 50, y: 780, size: 16, font: fontBold });
  page.drawText(subtitle, { x: 50, y: 755, size: 11, font });
  page.drawText(`ID: ${crypto.randomUUID()}`, { x: 50, y: 735, size: 9, font });
  page.drawText(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, {
    x: 50,
    y: 715,
    size: 9,
    font,
  });

  return new Uint8Array(await pdfDoc.save());
}

export function createTestCertificate(): {
  certificate: forge.pki.Certificate;
  privateKey: forge.pki.PrivateKey;
} {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const subject = [
    { name: 'commonName', value: 'Profissional Teste Mock' },
    { name: 'organizationName', value: 'Espaco Terapia OS' },
  ];
  const issuer = [
    { name: 'commonName', value: 'AC Brasil Mock ICP-Brasil' },
    { name: 'organizationName', value: 'ITI' },
  ];
  cert.setSubject(subject);
  cert.setIssuer(issuer);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  return { certificate: cert, privateKey: keys.privateKey };
}

/** P12 para upload manual no modal (somente desenvolvimento/testes). */
export function createTestCertificateP12(): {
  p12Bytes: Uint8Array;
  password: string;
} {
  const { certificate, privateKey } = createTestCertificate();
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
    privateKey,
    [certificate],
    TEST_CERT_PASSWORD,
    { algorithm: '3des' },
  );
  const der = forge.asn1.toDer(p12Asn1).getBytes();
  const p12Bytes = new Uint8Array(der.length);
  for (let i = 0; i < der.length; i++) {
    p12Bytes[i] = der.charCodeAt(i);
  }
  return { p12Bytes, password: TEST_CERT_PASSWORD };
}

export async function getMockPdfBytes(spec: MockPdfSpec): Promise<Uint8Array> {
  return createMockPdfBytes(spec.title, spec.subtitle);
}

/** Assina e persiste um documento mock (útil para seed e testes). */
export async function signMockDocument(
  pdfBytes: Uint8Array,
  type: SignedDocument['type'],
  name: string,
): Promise<string> {
  const { certificate, privateKey } = createTestCertificate();
  const signatureData = await signDocument(pdfBytes, certificate, privateKey);
  const signedDocument = await addSignatureVisualizationToPDF(pdfBytes, signatureData);
  return saveSignedDocument({
    name,
    originalDocument: pdfBytes,
    signedDocument,
    signatureData,
    type,
  });
}

export function downloadTestCertificateP12(): void {
  const { p12Bytes, password } = createTestCertificateP12();
  const blob = new Blob([new Uint8Array(p12Bytes)], {
    type: 'application/x-pkcs12',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'certificado-teste-icp-mock.p12';
  a.click();
  URL.revokeObjectURL(url);
  void password;
}
