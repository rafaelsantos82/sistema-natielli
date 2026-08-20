import { describe, expect, it } from 'vitest';
import { changePasswordFormSchema, profileFormSchema } from '@/lib/validations/account.schema';

describe('profileFormSchema', () => {
  it('accepts valid profile name', () => {
    const result = profileFormSchema.safeParse({ name: 'Maria Silva' });
    expect(result.success).toBe(true);
  });

  it('rejects short name', () => {
    const result = profileFormSchema.safeParse({ name: 'A' });
    expect(result.success).toBe(false);
  });
});

describe('changePasswordFormSchema', () => {
  it('accepts valid password change', () => {
    const result = changePasswordFormSchema.safeParse({
      currentPassword: 'old-pass-1',
      newPassword: 'new-pass-12',
      confirmPassword: 'new-pass-12',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = changePasswordFormSchema.safeParse({
      currentPassword: 'old-pass-1',
      newPassword: 'new-pass-12',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without number', () => {
    const result = changePasswordFormSchema.safeParse({
      currentPassword: 'old-pass-1',
      newPassword: 'abcdefgh',
      confirmPassword: 'abcdefgh',
    });
    expect(result.success).toBe(false);
  });

  it('rejects new password equal to current', () => {
    const result = changePasswordFormSchema.safeParse({
      currentPassword: 'same1234',
      newPassword: 'same1234',
      confirmPassword: 'same1234',
    });
    expect(result.success).toBe(false);
  });
});
