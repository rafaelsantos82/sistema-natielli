import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ItemEstoque, Movimentacao } from '@/hooks/useEstoque';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const generateEstoquePDF = (
  itens: ItemEstoque[],
  filtros: {
    categoria?: string;
    status?: string;
    nivelEstoque?: string;
  }
) => {
  const doc = new jsPDF();

  // Cabeçalho
  doc.setFontSize(18);
  doc.text('Relatório de Estoque', 14, 20);

  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 28);

  // Filtros aplicados
  let yPosition = 35;
  if (filtros.categoria || filtros.status || filtros.nivelEstoque) {
    doc.setFontSize(11);
    doc.text('Filtros Aplicados:', 14, yPosition);
    yPosition += 7;

    doc.setFontSize(9);
    if (filtros.categoria) {
      doc.text(`• Categoria: ${filtros.categoria}`, 14, yPosition);
      yPosition += 5;
    }
    if (filtros.status) {
      doc.text(`• Status: ${filtros.status}`, 14, yPosition);
      yPosition += 5;
    }
    if (filtros.nivelEstoque) {
      doc.text(`• Nível de Estoque: ${filtros.nivelEstoque}`, 14, yPosition);
      yPosition += 5;
    }
    yPosition += 5;
  }

  // Estatísticas
  const totalItens = itens.length;
  const itensAtivos = itens.filter((i) => i.status === 'Ativo').length;
  const itensBaixo = itens.filter((i) => i.estoque_atual <= i.estoque_minimo).length;

  doc.setFontSize(11);
  doc.text('Resumo:', 14, yPosition);
  yPosition += 7;

  doc.setFontSize(9);
  doc.text(`Total de Itens: ${totalItens}`, 14, yPosition);
  doc.text(`Itens Ativos: ${itensAtivos}`, 80, yPosition);
  doc.text(`Estoque Baixo: ${itensBaixo}`, 146, yPosition);
  yPosition += 10;

  // Tabela de itens
  autoTable(doc, {
    startY: yPosition,
    head: [['Código', 'Nome', 'Categoria', 'Estoque Atual', 'Estoque Mínimo', 'Status']],
    body: itens.map((item) => [
      item.codigo,
      item.nome,
      item.categoria,
      `${item.estoque_atual} ${item.unidade_medida}`,
      `${item.estoque_minimo}`,
      item.status,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [71, 85, 105] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  return doc;
};

export const generateMovimentacoesCSV = (movimentacoes: Movimentacao[]) => {
  const headers = [
    'Data/Hora',
    'Item',
    'Tipo',
    'Quantidade',
    'Documento',
    'Motivo',
    'Responsável',
    'Saldo Anterior',
    'Saldo Atual',
  ];

  const rows = movimentacoes.map((mov) => [
    format(new Date(mov.data_hora), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    mov.item_nome,
    mov.tipo,
    mov.quantidade.toString(),
    mov.documento || '-',
    mov.motivo,
    mov.responsavel_nome,
    mov.saldo_anterior.toString(),
    mov.saldo_atual.toString(),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
