import forge from 'node-forge';
import { PDFDocument } from 'pdf-lib';

export interface CertificateInfo {
  commonName: string;
  organization: string;
  cpf?: string;
  cnpj?: string;
  validFrom: Date;
  validTo: Date;
  issuer: string;
  serialNumber: string;
}

export interface SignatureData {
  documentHash: string;
  signature: string;
  certificate: string;
  signedAt: Date;
  signerInfo: CertificateInfo;
  algorithm: string;
}

const documentBytesToBinaryString = (documentBytes: Uint8Array): string =>
  forge.util.binary.raw.encode(documentBytes);

/**
 * Reads a certificate file (PFX/P12) and extracts certificate information
 */
export const readCertificate = async (
  file: File,
  password: string
): Promise<{ certificate: forge.pki.Certificate; privateKey: forge.pki.PrivateKey; info: CertificateInfo }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const asn1 = forge.asn1.fromDer(forge.util.createBuffer(bytes).getBytes());
    const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);

    // Extract certificate and private key
    const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = bags[forge.pki.oids.certBag]?.[0];
    
    if (!certBag) {
      throw new Error('Nenhum certificado encontrado no arquivo');
    }

    const certificate = certBag.cert;
    
    if (!certificate) {
      throw new Error('Certificado inválido');
    }

    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
    
    if (!keyBag || !keyBag.key) {
      throw new Error('Chave privada não encontrada');
    }

    const privateKey = keyBag.key as forge.pki.PrivateKey;

    // Extract certificate information
    const subject = certificate.subject.attributes;
    const issuer = certificate.issuer.attributes;
    
    const getAttributeValue = (attributes: any[], oid: string) => {
      const attr = attributes.find((a) => a.shortName === oid || a.name === oid);
      return attr?.value || '';
    };

    // Try to extract CPF from certificate (OID 2.16.76.1.3.1 for ICP-Brasil)
    const cpfOid = '2.16.76.1.3.1';
    let cpf: string | undefined;
    
    // Look for CPF in subject alternative name or other extensions
    const extensions = certificate.extensions || [];
    extensions.forEach((ext: any) => {
      if (ext.id === cpfOid && ext.value) {
        cpf = ext.value;
      }
    });

    const info: CertificateInfo = {
      commonName: getAttributeValue(subject, 'CN'),
      organization: getAttributeValue(subject, 'O'),
      cpf,
      validFrom: certificate.validity.notBefore,
      validTo: certificate.validity.notAfter,
      issuer: getAttributeValue(issuer, 'CN'),
      serialNumber: certificate.serialNumber,
    };

    return { certificate, privateKey, info };
  } catch (error: any) {
    if (error.message.includes('Invalid password')) {
      throw new Error('Senha do certificado incorreta');
    }
    throw new Error(`Erro ao ler certificado: ${error.message}`);
  }
};

/**
 * Validates if a certificate is from ICP-Brasil chain
 */
export const validateICPBrasil = (certificate: forge.pki.Certificate): boolean => {
  const issuer = certificate.issuer.attributes;
  const issuerCN = issuer.find((a) => a.shortName === 'CN')?.value || '';
  
  // Check if issuer contains ICP-Brasil or AC (Autoridade Certificadora) Brasil
  const icpBrasilKeywords = [
    'ICP-Brasil',
    'AC Brasil',
    'Autoridade Certificadora',
    'ITI',
    'Certisign',
    'Serpro',
    'Serasa',
  ];
  
  return icpBrasilKeywords.some((keyword) => 
    issuerCN.toUpperCase().includes(keyword.toUpperCase())
  );
};

/**
 * Checks if certificate is valid (not expired)
 */
export const isCertificateValid = (certificate: forge.pki.Certificate): boolean => {
  const now = new Date();
  return now >= certificate.validity.notBefore && now <= certificate.validity.notAfter;
};

/**
 * Signs a document (PDF bytes) with the provided certificate and private key
 */
export const signDocument = async (
  documentBytes: Uint8Array,
  certificate: forge.pki.Certificate,
  privateKey: forge.pki.PrivateKey
): Promise<SignatureData> => {
  // Create document hash (SHA-256)
  const md = forge.md.sha256.create();
  md.update(documentBytesToBinaryString(documentBytes));
  const hash = md.digest();

  // Sign the hash with private key
  const signature = (privateKey as any).sign(md);

  // Convert certificate to PEM
  const certificatePem = forge.pki.certificateToPem(certificate);

  const subject = certificate.subject.attributes;
  const getAttributeValue = (attributes: any[], oid: string) => {
    const attr = attributes.find((a) => a.shortName === oid || a.name === oid);
    return attr?.value || '';
  };

  const signatureData: SignatureData = {
    documentHash: forge.util.encode64(hash.bytes()),
    signature: forge.util.encode64(signature),
    certificate: certificatePem,
    signedAt: new Date(),
    signerInfo: {
      commonName: getAttributeValue(subject, 'CN'),
      organization: getAttributeValue(subject, 'O'),
      validFrom: certificate.validity.notBefore,
      validTo: certificate.validity.notAfter,
      issuer: certificate.issuer.attributes.find((a) => a.shortName === 'CN')?.value || '',
      serialNumber: certificate.serialNumber,
    },
    algorithm: 'SHA256withRSA',
  };

  return signatureData;
};

/**
 * Adds signature visualization to PDF
 */
export const addSignatureVisualizationToPDF = async (
  pdfBytes: Uint8Array,
  signatureData: SignatureData
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { height } = lastPage.getSize();

  // Add signature information as text
  const fontSize = 8;
  const yPosition = 50;

  lastPage.drawText('DOCUMENTO ASSINADO DIGITALMENTE', {
    x: 50,
    y: yPosition + 40,
    size: 10,
  });

  lastPage.drawText(`Assinante: ${signatureData.signerInfo.commonName}`, {
    x: 50,
    y: yPosition + 28,
    size: fontSize,
  });

  lastPage.drawText(`Organização: ${signatureData.signerInfo.organization}`, {
    x: 50,
    y: yPosition + 20,
    size: fontSize,
  });

  lastPage.drawText(`Data/Hora: ${signatureData.signedAt.toLocaleString('pt-BR')}`, {
    x: 50,
    y: yPosition + 12,
    size: fontSize,
  });

  lastPage.drawText(`Algoritmo: ${signatureData.algorithm}`, {
    x: 50,
    y: yPosition + 4,
    size: fontSize,
  });

  lastPage.drawText(`Hash do Documento: ${signatureData.documentHash.substring(0, 32)}...`, {
    x: 50,
    y: yPosition - 4,
    size: fontSize,
  });

  lastPage.drawText(`Certificado válido até: ${signatureData.signerInfo.validTo.toLocaleDateString('pt-BR')}`, {
    x: 50,
    y: yPosition - 12,
    size: fontSize,
  });

  // Draw a border around signature
  lastPage.drawRectangle({
    x: 45,
    y: yPosition - 18,
    width: 500,
    height: 65,
    borderWidth: 1,
  });

  return await pdfDoc.save();
};

/**
 * Verifies a signature
 */
export const verifySignature = async (
  documentBytes: Uint8Array,
  signatureData: SignatureData
): Promise<{ valid: boolean; message: string }> => {
  try {
    // Recreate document hash
    const md = forge.md.sha256.create();
    md.update(documentBytesToBinaryString(documentBytes));
    const hash = md.digest();

    // Check if hash matches
    if (forge.util.encode64(hash.bytes()) !== signatureData.documentHash) {
      return { valid: false, message: 'O documento foi modificado após a assinatura' };
    }

    // Load certificate
    const certificate = forge.pki.certificateFromPem(signatureData.certificate);

    // Check certificate validity
    if (!isCertificateValid(certificate)) {
      return { valid: false, message: 'Certificado expirado ou ainda não válido' };
    }

    // Verify signature with public key from certificate
    const publicKey = certificate.publicKey;
    const signature = forge.util.decode64(signatureData.signature);
    const verified = (publicKey as any).verify(hash.bytes(), signature);

    if (!verified) {
      return { valid: false, message: 'Assinatura digital inválida' };
    }

    return { valid: true, message: 'Assinatura válida' };
  } catch (error: any) {
    return { valid: false, message: `Erro na verificação: ${error.message}` };
  }
};

/**
 * Storage for signed documents
 */
export interface SignedDocument {
  id: string;
  name: string;
  originalDocument: Uint8Array;
  signedDocument: Uint8Array;
  signatureData: SignatureData;
  createdAt: Date;
  type: 'prontuario' | 'prescricao' | 'atestado';
}

const STORAGE_KEY = 'signed_documents';

export const saveSignedDocument = (doc: Omit<SignedDocument, 'id' | 'createdAt'>): string => {
  const id = crypto.randomUUID();
  const signedDoc: SignedDocument = {
    ...doc,
    id,
    createdAt: new Date(),
  };

  const stored = localStorage.getItem(STORAGE_KEY);
  const documents: any[] = stored ? JSON.parse(stored) : [];
  
  // Convert Uint8Array to base64 for storage
  const docToStore = {
    ...signedDoc,
    createdAt: signedDoc.createdAt.toISOString(),
    originalDocument: btoa(String.fromCharCode(...Array.from(signedDoc.originalDocument))),
    signedDocument: btoa(String.fromCharCode(...Array.from(signedDoc.signedDocument))),
  };
  
  documents.push(docToStore);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  
  return id;
};

export const getSignedDocuments = (): SignedDocument[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  const documents = JSON.parse(stored);
  
  // Convert base64 back to Uint8Array
  return documents.map((doc: any) => ({
    ...doc,
    originalDocument: new Uint8Array(
      atob(doc.originalDocument)
        .split('')
        .map((c) => c.charCodeAt(0))
    ),
    signedDocument: new Uint8Array(
      atob(doc.signedDocument)
        .split('')
        .map((c) => c.charCodeAt(0))
    ),
    createdAt: new Date(doc.createdAt),
  }));
};
