import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { pacienteSchema, PacienteFormData } from '@/lib/validations/paciente.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface PacienteQuickFormProps {
  initialData?: Partial<PacienteFormData>;
  onSubmit: (data: PacienteFormData) => void;
  isLoading?: boolean;
}

export const PacienteQuickForm = ({ initialData, onSubmit, isLoading }: PacienteQuickFormProps) => {
  const [novaPessoa, setNovaPessoa] = useState('');
  const [pessoas, setPessoas] = useState<string[]>(initialData?.pessoas_autorizadas_busca ?? []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: {
      status: 'ativo',
      consentimento_lgpd: false,
      autorizacao_uso_imagem: false,
      pessoas_autorizadas_busca: initialData?.pessoas_autorizadas_busca ?? [],
      ...initialData,
    },
  });

  const adicionarPessoa = () => {
    const nome = novaPessoa.trim();
    if (!nome) return;
    const novaLista = [...pessoas, nome];
    setPessoas(novaLista);
    setValue('pessoas_autorizadas_busca', novaLista);
    setNovaPessoa('');
  };

  const removerPessoa = (idx: number) => {
    const novaLista = pessoas.filter((_, i) => i !== idx);
    setPessoas(novaLista);
    setValue('pessoas_autorizadas_busca', novaLista);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-1">
      {/* Identificação */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">🧍‍♂️ Identificação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nome_completo">Nome Completo *</Label>
            <Input id="nome_completo" {...register('nome_completo')} />
            {errors.nome_completo && (
              <p className="text-sm text-destructive">{errors.nome_completo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
            <Input type="date" id="data_nascimento" {...register('data_nascimento')} />
            {errors.data_nascimento && (
              <p className="text-sm text-destructive">{errors.data_nascimento.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sexo_biologico">Sexo Biológico *</Label>
            <Select
              onValueChange={(value) => setValue('sexo_biologico', value as any)}
              defaultValue={initialData?.sexo_biologico}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="intersexo">Intersexo</SelectItem>
              </SelectContent>
            </Select>
            {errors.sexo_biologico && (
              <p className="text-sm text-destructive">{errors.sexo_biologico.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF do paciente</Label>
            <Input id="cpf" {...register('cpf')} placeholder="000.000.000-00" />
            {errors.cpf && (
              <p className="text-sm text-destructive">{errors.cpf.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Informe pelo menos um: CPF do paciente ou do responsável.
            </p>
          </div>
        </div>
      </section>

      {/* Endereço */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">🏠 Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cep">CEP *</Label>
            <Input id="cep" {...register('cep')} placeholder="00000-000" />
            {errors.cep && (
              <p className="text-sm text-destructive">{errors.cep.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="uf">UF *</Label>
            <Input id="uf" maxLength={2} {...register('uf')} placeholder="SP" />
            {errors.uf && (
              <p className="text-sm text-destructive">{errors.uf.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" {...register('endereco')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numero">Número</Label>
            <Input id="numero" {...register('numero')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro</Label>
            <Input id="bairro" {...register('bairro')} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" {...register('cidade')} />
          </div>
        </div>
      </section>

      {/* Contato */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">📞 Contato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tel_principal">Telefone Principal *</Label>
            <Input
              id="tel_principal"
              {...register('tel_principal')}
              placeholder="(00) 00000-0000"
            />
            {errors.tel_principal && (
              <p className="text-sm text-destructive">{errors.tel_principal.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input type="email" id="email" {...register('email')} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Responsável legal</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="responsavel_nome">Nome do responsável *</Label>
            <Input
              id="responsavel_nome"
              {...register('responsavel_nome')}
              placeholder="Para pacientes menores de idade"
            />
            {errors.responsavel_nome && (
              <p className="text-sm text-destructive">{errors.responsavel_nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel_cpf">CPF do responsável legal</Label>
            <Input
              id="responsavel_cpf"
              {...register('responsavel_cpf')}
              placeholder="000.000.000-00"
            />
            {errors.responsavel_cpf && (
              <p className="text-sm text-destructive">{errors.responsavel_cpf.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Pessoas Autorizadas a Buscar */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">
          👥 Pessoas Autorizadas a Buscar a Criança
        </h3>
        <div className="flex gap-2">
          <Input
            value={novaPessoa}
            onChange={(e) => setNovaPessoa(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                adicionarPessoa();
              }
            }}
            placeholder="Nome da pessoa autorizada"
          />
          <Button type="button" onClick={adicionarPessoa} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
        {pessoas.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {pessoas.map((p, idx) => (
              <li key={idx}>
                <Badge variant="secondary" className="gap-1.5 pr-1.5 py-1">
                  {p}
                  <button
                    type="button"
                    onClick={() => removerPessoa(idx)}
                    className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                    aria-label={`Remover ${p}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Consentimentos */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">📜 Consentimentos</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="consentimento_lgpd"
              onCheckedChange={(checked) => setValue('consentimento_lgpd', checked as boolean, { shouldValidate: true })}
            />
            <div className="space-y-1">
              <Label htmlFor="consentimento_lgpd" className="leading-snug">
                Consentimento LGPD *
              </Label>
              <p className="text-xs text-muted-foreground">
                Autorizo o tratamento dos meus dados pessoais conforme a Lei Geral de Proteção de Dados.
              </p>
              {errors.consentimento_lgpd && (
                <p className="text-sm text-destructive">{errors.consentimento_lgpd.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="autorizacao_uso_imagem"
              onCheckedChange={(checked) => setValue('autorizacao_uso_imagem', checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="autorizacao_uso_imagem" className="leading-snug">
                Autorização de Uso de Imagem
              </Label>
              <p className="text-xs text-muted-foreground">
                Autorizo o uso da imagem do paciente para fins clínicos e institucionais.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Cadastro'}
        </Button>
      </div>
    </form>
  );
};
