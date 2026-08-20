import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getErrorToastProps } from '@/lib/ui/showErrorToast';
import { Plus, Trash2, Download, Upload } from 'lucide-react';
import { format, isAfter, isBefore, isEqual, parseISO } from 'date-fns';

interface PriceEntry {
  id: string;
  nome_terapia: string;
  valor: number;
  vigenciaInicio: string;
  vigenciaFim: string;
}

type StoredPriceEntry = PriceEntry & { tratamento?: string };

const normalizePriceEntry = (entry: StoredPriceEntry): PriceEntry => ({
  id: entry.id,
  nome_terapia: entry.nome_terapia ?? entry.tratamento ?? '',
  valor: entry.valor,
  vigenciaInicio: entry.vigenciaInicio,
  vigenciaFim: entry.vigenciaFim,
});

interface ManagePricesModalProps {
  isOpen: boolean;
  onClose: () => void;
  profissionalId: string | number;
  profissionalNome: string;
}

export const ManagePricesModal = ({ isOpen, onClose, profissionalId, profissionalNome }: ManagePricesModalProps) => {
  const { toast } = useToast();
  const [prices, setPrices] = useState<PriceEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPrices();
    }
  }, [isOpen, profissionalId]);

  const loadPrices = () => {
    const stored = localStorage.getItem(`prices_${profissionalId}`);
    if (!stored) return;
    const parsed = JSON.parse(stored) as StoredPriceEntry[];
    const normalized = parsed.map(normalizePriceEntry);
    setPrices(normalized);
    localStorage.setItem(`prices_${profissionalId}`, JSON.stringify(normalized));
  };

  const savePrices = (newPrices: PriceEntry[]) => {
    localStorage.setItem(`prices_${profissionalId}`, JSON.stringify(newPrices));
    setPrices(newPrices);
  };

  const validateDateOverlap = (newEntry: PriceEntry, excludeId?: string): boolean => {
    const overlapping = prices.filter(p => p.id !== excludeId && p.nome_terapia === newEntry.nome_terapia);
    
    for (const existing of overlapping) {
      const newStart = parseISO(newEntry.vigenciaInicio);
      const newEnd = parseISO(newEntry.vigenciaFim);
      const existingStart = parseISO(existing.vigenciaInicio);
      const existingEnd = parseISO(existing.vigenciaFim);

      const hasOverlap = !(isAfter(newStart, existingEnd) || isBefore(newEnd, existingStart));
      
      if (hasOverlap) {
        toast({
          title: 'Erro de validação',
          description: `Período se sobrepõe com vigência existente: ${format(existingStart, 'dd/MM/yyyy')} - ${format(existingEnd, 'dd/MM/yyyy')}`,
          variant: 'destructive',
        });
        return false;
      }
    }
    return true;
  };

  const handleAddRow = () => {
    const newEntry: PriceEntry = {
      id: Date.now().toString(),
      nome_terapia: '',
      valor: 0,
      vigenciaInicio: format(new Date(), 'yyyy-MM-dd'),
      vigenciaFim: format(new Date(), 'yyyy-MM-dd'),
    };
    setPrices([...prices, newEntry]);
    setEditingId(newEntry.id);
  };

  const handleDeleteRow = (id: string) => {
    const newPrices = prices.filter(p => p.id !== id);
    savePrices(newPrices);
  };

  const handleCellChange = (id: string, field: keyof PriceEntry, value: string | number) => {
    const newPrices = prices.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    );
    setPrices(newPrices);
  };

  const handleSaveRow = (id: string) => {
    const entry = prices.find(p => p.id === id);
    if (!entry) return;

    if (!entry.nome_terapia || entry.valor <= 0) {
      toast({
        title: 'Erro de validação',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (isAfter(parseISO(entry.vigenciaInicio), parseISO(entry.vigenciaFim))) {
      toast({
        title: 'Erro de validação',
        description: 'Data de início deve ser anterior à data de fim',
        variant: 'destructive',
      });
      return;
    }

    if (!validateDateOverlap(entry, id)) {
      return;
    }

    savePrices(prices);
    setEditingId(null);
    toast({
      title: 'Sucesso',
      description: 'Preço salvo com sucesso',
    });
  };

  const handleExportCSV = () => {
    const headers = ['Terapia', 'Valor', 'Vigência Início', 'Vigência Fim'];
    const rows = prices.map(p => [
      p.nome_terapia,
      p.valor.toString(),
      p.vigenciaInicio,
      p.vigenciaFim
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `precos_${profissionalNome}_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();

    toast({
      title: 'Sucesso',
      description: 'CSV exportado com sucesso',
    });
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const data = lines.slice(1).map((line, index) => {
          const [nomeTerapia, valor, vigenciaInicio, vigenciaFim] = line.split(',');
          return {
            id: `import_${Date.now()}_${index}`,
            nome_terapia: nomeTerapia.trim(),
            valor: parseFloat(valor.trim()),
            vigenciaInicio: vigenciaInicio.trim(),
            vigenciaFim: vigenciaFim.trim(),
          };
        });

        savePrices([...prices, ...data]);
        toast({
          title: 'Sucesso',
          description: `${data.length} registros importados`,
        });
      } catch (error) {
        toast(getErrorToastProps(error, { action: 'importar', entity: 'os preços' }));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Preços - {profissionalNome}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button onClick={handleAddRow} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Label htmlFor="csv-upload" className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Importar CSV
              </span>
            </Button>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCSV}
            />
          </Label>
        </div>

        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Terapia</TableHead>
                <TableHead>Valor (R$)</TableHead>
                <TableHead>Vigência Início</TableHead>
                <TableHead>Vigência Fim</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum preço cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                prices.map((price) => (
                  <TableRow key={price.id}>
                    <TableCell>
                      <Input
                        value={price.nome_terapia}
                        onChange={(e) => handleCellChange(price.id, 'nome_terapia', e.target.value)}
                        placeholder="Nome da terapia"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={price.valor}
                        onChange={(e) => handleCellChange(price.id, 'valor', parseFloat(e.target.value))}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={price.vigenciaInicio}
                        onChange={(e) => handleCellChange(price.id, 'vigenciaInicio', e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={price.vigenciaFim}
                        onChange={(e) => handleCellChange(price.id, 'vigenciaFim', e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {editingId === price.id ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveRow(price.id)}
                            className="h-8 px-2"
                          >
                            Salvar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(price.id)}
                            className="h-8 px-2"
                          >
                            Editar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRow(price.id)}
                          className="h-8 px-2 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
