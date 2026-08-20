import { Input } from '@/components/ui/input';
import { forwardRef } from 'react';

export type MaskType = 'cpf' | 'cnpj' | 'cep' | 'phone' | 'date' | 'time';

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: MaskType;
  value: string;
  onChange: (value: string) => void;
}

const applyMask = (value: string, mask: MaskType): string => {
  const cleaned = value.replace(/\D/g, '');
  
  switch (mask) {
    case 'cpf':
      return cleaned
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    case 'cnpj':
      return cleaned
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    
    case 'cep':
      return cleaned
        .slice(0, 8)
        .replace(/(\d{5})(\d)/, '$1-$2');
    
    case 'phone':
      if (cleaned.length <= 10) {
        return cleaned
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d)/, '$1-$2');
      }
      return cleaned
        .slice(0, 11)
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    
    case 'date':
      return cleaned
        .slice(0, 8)
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2');
    
    case 'time':
      return cleaned
        .slice(0, 4)
        .replace(/(\d{2})(\d)/, '$1:$2');
    
    default:
      return value;
  }
};

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const maskedValue = applyMask(e.target.value, mask);
      onChange(maskedValue);
    };

    return (
      <Input
        ref={ref}
        {...props}
        value={value}
        onChange={handleChange}
      />
    );
  }
);

MaskedInput.displayName = 'MaskedInput';
