import { Input } from '@/components/ui/input';
import { forwardRef } from 'react';

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number | string;
  onChange: (value: number) => void;
  currency?: string;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, currency = 'BRL', ...props }, ref) => {
    const formatMoney = (val: number | string): string => {
      const num = typeof val === 'string' ? parseFloat(val) || 0 : val;
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
      }).format(num);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleaned = e.target.value.replace(/\D/g, '');
      const number = parseInt(cleaned, 10) / 100;
      onChange(isNaN(number) ? 0 : number);
    };

    return (
      <Input
        ref={ref}
        {...props}
        value={formatMoney(value)}
        onChange={handleChange}
      />
    );
  }
);

MoneyInput.displayName = 'MoneyInput';
