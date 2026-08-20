import { describe, it, expect } from 'vitest';
import { validateContratoDocFile } from '@/lib/uploads/contratoDocPolicy';

function makeFile(name: string, type: string, size = 100): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('validateContratoDocFile', () => {
  it('aceita PDF', () => {
    expect(() => validateContratoDocFile(makeFile('a.pdf', 'application/pdf'))).not.toThrow();
  });

  it('aceita DOC e DOCX', () => {
    expect(() => validateContratoDocFile(makeFile('a.doc', 'application/msword'))).not.toThrow();
    expect(() =>
      validateContratoDocFile(
        makeFile(
          'a.docx',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ),
      ),
    ).not.toThrow();
  });

  it('rejeita imagem', () => {
    expect(() => validateContratoDocFile(makeFile('foto.jpg', 'image/jpeg'))).toThrow(
      /não permitido/i,
    );
  });

  it('rejeita arquivo grande', () => {
    const big = makeFile('big.pdf', 'application/pdf', 11 * 1024 * 1024);
    expect(() => validateContratoDocFile(big)).toThrow(/10 MB/i);
  });
});
