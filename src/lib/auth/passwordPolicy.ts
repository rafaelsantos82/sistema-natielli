export type PasswordRequirementKey =
  | 'minLength'
  | 'hasNumber'
  | 'passwordsMatch'
  | 'differentFromCurrent';

export type PasswordRequirementChecks = Record<PasswordRequirementKey, boolean>;

export const PASSWORD_REQUIREMENT_LABELS: Record<PasswordRequirementKey, string> = {
  minLength: 'Pelo menos 8 caracteres',
  hasNumber: 'Incluir pelo menos um número',
  passwordsMatch: 'As senhas devem coincidir',
  differentFromCurrent: 'Deve ser diferente da senha atual',
};

export function evaluatePasswordRequirements(opts: {
  newPassword: string;
  confirmPassword: string;
  currentPassword?: string;
}): PasswordRequirementChecks {
  const { newPassword, confirmPassword, currentPassword = '' } = opts;
  const confirmFilled = confirmPassword.length > 0;

  return {
    minLength: newPassword.length >= 8,
    hasNumber: /\d/.test(newPassword),
    passwordsMatch: !confirmFilled || newPassword === confirmPassword,
    differentFromCurrent:
      currentPassword.length === 0 || newPassword.length === 0 || newPassword !== currentPassword,
  };
}

export function allRequirementsMet(checks: PasswordRequirementChecks): boolean {
  return (
    checks.minLength &&
    checks.hasNumber &&
    checks.passwordsMatch &&
    checks.differentFromCurrent
  );
}

/** Exibe falhas em vermelho após o usuário começar a digitar nova ou confirmar senha. */
export function shouldShowPasswordErrors(newPassword: string, confirmPassword: string): boolean {
  return newPassword.length > 0 || confirmPassword.length > 0;
}
