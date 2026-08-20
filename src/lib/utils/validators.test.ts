import { describe, it, expect } from 'vitest';
import { formatCPF, formatCNPJ, validateCPF, validateCNPJ } from '@/lib/utils/validators';

describe('validators', () => {
  describe('formatCPF', () => {
    it('formats digits only', () => {
      expect(formatCPF('12345678909')).toBe('123.456.789-09');
    });

    it('keeps already formatted value', () => {
      expect(formatCPF('123.456.789-09')).toBe('123.456.789-09');
    });
  });

  describe('validateCPF', () => {
    it('accepts valid CPF with or without mask', () => {
      expect(validateCPF('12345678909')).toBe(true);
      expect(validateCPF('123.456.789-09')).toBe(true);
    });

    it('rejects invalid length and repeated digits', () => {
      expect(validateCPF('1234567890')).toBe(false);
      expect(validateCPF('11111111111')).toBe(false);
    });
  });

  describe('formatCNPJ', () => {
    it('formats digits only', () => {
      expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81');
    });

    it('keeps already formatted value', () => {
      expect(formatCNPJ('11.222.333/0001-81')).toBe('11.222.333/0001-81');
    });
  });

  describe('validateCNPJ', () => {
    it('accepts valid CNPJ with or without mask', () => {
      expect(validateCNPJ('11222333000181')).toBe(true);
      expect(validateCNPJ('11.222.333/0001-81')).toBe(true);
    });

    it('rejects invalid length and repeated digits', () => {
      expect(validateCNPJ('1122233300018')).toBe(false);
      expect(validateCNPJ('11111111111111')).toBe(false);
    });
  });
});
