import { describe, expect, it } from 'vitest';
import {
  allRequirementsMet,
  evaluatePasswordRequirements,
  shouldShowPasswordErrors,
} from '@/lib/auth/passwordPolicy';

describe('evaluatePasswordRequirements', () => {
  it('passes when all rules satisfied', () => {
    const checks = evaluatePasswordRequirements({
      newPassword: 'abc12345',
      confirmPassword: 'abc12345',
      currentPassword: 'old-pass-1',
    });
    expect(allRequirementsMet(checks)).toBe(true);
  });

  it('fails minLength without 8 chars', () => {
    const checks = evaluatePasswordRequirements({
      newPassword: 'ab1',
      confirmPassword: 'ab1',
    });
    expect(checks.minLength).toBe(false);
  });

  it('fails hasNumber without digit', () => {
    const checks = evaluatePasswordRequirements({
      newPassword: 'abcdefgh',
      confirmPassword: 'abcdefgh',
    });
    expect(checks.hasNumber).toBe(false);
  });

  it('fails passwordsMatch when confirm differs', () => {
    const checks = evaluatePasswordRequirements({
      newPassword: 'abc12345',
      confirmPassword: 'abc12346',
    });
    expect(checks.passwordsMatch).toBe(false);
  });

  it('allows empty confirm without failing match', () => {
    const checks = evaluatePasswordRequirements({
      newPassword: 'abc12345',
      confirmPassword: '',
    });
    expect(checks.passwordsMatch).toBe(true);
  });

  it('fails when new equals current', () => {
    const checks = evaluatePasswordRequirements({
      newPassword: 'same1234',
      confirmPassword: 'same1234',
      currentPassword: 'same1234',
    });
    expect(checks.differentFromCurrent).toBe(false);
  });
});

describe('shouldShowPasswordErrors', () => {
  it('is false when both empty', () => {
    expect(shouldShowPasswordErrors('', '')).toBe(false);
  });

  it('is true when new has content', () => {
    expect(shouldShowPasswordErrors('a', '')).toBe(true);
  });
});
