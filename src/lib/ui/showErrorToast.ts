import { toast as sonnerToast } from 'sonner';
import {
  formatApiErrorForToast,
  type ToastErrorContext,
} from '@/lib/api/formatApiError';

export type ToastLibrary = 'sonner' | 'shadcn';

export type ShadcnToastFn = (props: {
  title?: string;
  description?: string;
  variant?: 'destructive';
}) => void;

export type ErrorToastProps = {
  title: string;
  description: string;
  variant: 'destructive';
};

/**
 * Exibe toast de erro com título e descrição amigáveis.
 * - `library: 'sonner'`: usa sonner (hooks, auth).
 * - `library: 'shadcn'`: passa `shadcnToast` de useToast().
 */
export function showErrorToast(
  error: unknown,
  ctx?: ToastErrorContext,
  options?: {
    library?: ToastLibrary;
    shadcnToast?: ShadcnToastFn;
  },
): void {
  const { title, description } = formatApiErrorForToast(error, ctx);
  const library = options?.library ?? 'sonner';

  if (library === 'shadcn' && options?.shadcnToast) {
    options.shadcnToast({
      title,
      description,
      variant: 'destructive',
    });
    return;
  }

  sonnerToast.error(title, { description });
}

/** Retorna props para uso manual com useToast(). */
export function getErrorToastProps(
  error: unknown,
  ctx?: ToastErrorContext,
): ErrorToastProps {
  const { title, description } = formatApiErrorForToast(error, ctx);
  return { title, description, variant: 'destructive' };
}
