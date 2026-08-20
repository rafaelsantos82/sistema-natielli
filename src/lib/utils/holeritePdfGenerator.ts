import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FolhaCLT, FuncionarioCLT } from '@/lib/validations/folhaPagamento.schema';

export const generateHoleritePDF = (
  folha: FolhaCLT,
  funcionario: FuncionarioCLT
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabeçalho
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('HOLERITE - FOLHA DE PAGAMENTO', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Natielli Paula', pageWidth / 2, 28, { align: 'center' });

  // Linha separadora
  doc.setDrawColor(0, 0, 0);
  doc.line(15, 32, pageWidth - 15, 32);

  // Dados do Funcionário
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO FUNCIONÁRIO', 15, 42);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const dadosFuncionario = [
    ['Nome:', funcionario.nome],
    ['CPF:', funcionario.cpf],
    ['Cargo:', funcionario.cargo],
    ['Data de Admissão:', new Date(funcionario.data_admissao).toLocaleDateString('pt-BR')],
  ];

  autoTable(doc, {
    startY: 46,
    head: [],
    body: dadosFuncionario,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    }
  });

  // Dados do Período
  const mesAno = folha.mes_referencia.split('-');
  const mesReferencia = new Date(parseInt(mesAno[0]), parseInt(mesAno[1]) - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PERÍODO DE REFERÊNCIA', 15, (doc as any).lastAutoTable.finalY + 10);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(mesReferencia.toUpperCase(), 15, (doc as any).lastAutoTable.finalY + 18);

  // Tabela de Proventos
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PROVENTOS', 15, (doc as any).lastAutoTable.finalY + 30);

  const proventos = [
    ['Salário Base', formatCurrency(folha.salario_base)],
    ['Horas Extras', formatCurrency(folha.horas_extras)],
    ['Adicional Noturno', formatCurrency(folha.adicional_noturno)],
    ['Outros Proventos', formatCurrency(folha.outros_proventos)],
  ];

  const totalProventos = folha.salario_base + folha.horas_extras + folha.adicional_noturno + folha.outros_proventos;

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 34,
    head: [['Descrição', 'Valor']],
    body: proventos,
    foot: [['TOTAL DE PROVENTOS', formatCurrency(totalProventos)]],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: 'right' }
    }
  });

  // Tabela de Descontos
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DESCONTOS', 15, (doc as any).lastAutoTable.finalY + 10);

  const descontos = [
    ['INSS', formatCurrency(folha.inss)],
    ['IRRF', formatCurrency(folha.irrf)],
    ['Vale Transporte (6%)', formatCurrency(folha.vale_transporte)],
    ['Outros Descontos', formatCurrency(folha.outros_descontos)],
  ];

  const totalDescontos = folha.inss + folha.irrf + folha.vale_transporte + folha.outros_descontos;

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 14,
    head: [['Descrição', 'Valor']],
    body: descontos,
    foot: [['TOTAL DE DESCONTOS', formatCurrency(totalDescontos)]],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [217, 83, 79], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: 'right' }
    }
  });

  // Informações Adicionais
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`FGTS (8%): ${formatCurrency(folha.fgts)}`, 15, (doc as any).lastAutoTable.finalY + 8);
  doc.text(`Vale Alimentação: ${formatCurrency(folha.vale_alimentacao)}`, 15, (doc as any).lastAutoTable.finalY + 14);

  // Salário Líquido
  doc.setFillColor(92, 184, 92);
  doc.rect(15, (doc as any).lastAutoTable.finalY + 20, pageWidth - 30, 15, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SALÁRIO LÍQUIDO:', 20, (doc as any).lastAutoTable.finalY + 29);
  doc.text(formatCurrency(folha.salario_liquido), pageWidth - 20, (doc as any).lastAutoTable.finalY + 29, { align: 'right' });
  
  // Resetar cor do texto
  doc.setTextColor(0, 0, 0);

  // Rodapé
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const dataEmissao = new Date().toLocaleDateString('pt-BR');
  doc.text(`Emitido em: ${dataEmissao}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
  doc.text('Este documento não possui valor legal. Consulte o RH para documentos oficiais.', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  // Gerar nome do arquivo
  const nomeArquivo = `holerite_${funcionario.nome.replace(/\s+/g, '_')}_${folha.mes_referencia}.pdf`;
  
  // Fazer download
  doc.save(nomeArquivo);
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
