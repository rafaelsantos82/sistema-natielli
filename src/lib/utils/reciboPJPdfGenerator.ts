import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FolhaPJ, FuncionarioPJ } from '@/lib/validations/folhaPagamento.schema';

export const generateReciboPJPDF = (
  folha: FolhaPJ,
  funcionario: FuncionarioPJ
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabeçalho
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBO DE PAGAMENTO - PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Espaço Terapia', pageWidth / 2, 28, { align: 'center' });

  // Linha separadora
  doc.setDrawColor(0, 0, 0);
  doc.line(15, 32, pageWidth - 15, 32);

  // Dados do Prestador
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO PRESTADOR', 15, 42);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const dadosPrestador = [
    ['Nome:', funcionario.nome],
    ['CNPJ:', funcionario.cnpj],
    ['Razão Social:', funcionario.razao_social],
    ['Serviço:', funcionario.servico],
  ];

  autoTable(doc, {
    startY: 46,
    head: [],
    body: dadosPrestador,
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

  // Tabela de Serviços Prestados
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DISCRIMINAÇÃO DOS SERVIÇOS', 15, (doc as any).lastAutoTable.finalY + 30);

  const servicos = [
    ['Horas Trabalhadas', `${folha.horas_trabalhadas}h`],
    ['Valor por Hora', formatCurrency(folha.valor_hora)],
    ['Valor Total Bruto', formatCurrency(folha.valor_total)],
  ];

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 34,
    head: [['Descrição', 'Valor']],
    body: servicos,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: 'right' }
    }
  });

  // Descrição dos Serviços
  if (folha.descricao_servicos) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Descrição dos Serviços:', 15, (doc as any).lastAutoTable.finalY + 10);
    
    doc.setFont('helvetica', 'normal');
    const splitText = doc.splitTextToSize(folha.descricao_servicos, pageWidth - 30);
    doc.text(splitText, 15, (doc as any).lastAutoTable.finalY + 16);
  }

  // Tabela de Retenções
  const retencaoY = folha.descricao_servicos 
    ? (doc as any).lastAutoTable.finalY + 26 + (doc.splitTextToSize(folha.descricao_servicos, pageWidth - 30).length * 5)
    : (doc as any).lastAutoTable.finalY + 16;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RETENÇÕES', 15, retencaoY);

  const retencoes = [
    ['Retenção ISS', formatCurrency(folha.retencao_iss)],
    ['Retenção IR', formatCurrency(folha.retencao_ir)],
  ];

  const totalRetencoes = folha.retencao_iss + folha.retencao_ir;

  autoTable(doc, {
    startY: retencaoY + 4,
    head: [['Descrição', 'Valor']],
    body: retencoes,
    foot: [['TOTAL DE RETENÇÕES', formatCurrency(totalRetencoes)]],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [217, 83, 79], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: 'right' }
    }
  });

  // Valor Líquido
  doc.setFillColor(92, 184, 92);
  doc.rect(15, (doc as any).lastAutoTable.finalY + 10, pageWidth - 30, 15, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('VALOR LÍQUIDO:', 20, (doc as any).lastAutoTable.finalY + 19);
  doc.text(formatCurrency(folha.valor_liquido), pageWidth - 20, (doc as any).lastAutoTable.finalY + 19, { align: 'right' });
  
  // Resetar cor do texto
  doc.setTextColor(0, 0, 0);

  // Informações de Pagamento
  if (folha.data_pagamento) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dataPagamento = new Date(folha.data_pagamento).toLocaleDateString('pt-BR');
    doc.text(`Data de Pagamento: ${dataPagamento}`, 15, (doc as any).lastAutoTable.finalY + 32);
  }

  // Declaração
  const declaracaoY = (doc as any).lastAutoTable.finalY + 45;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Declaro que recebi o valor acima referente aos serviços prestados no período indicado.', 15, declaracaoY);

  // Espaço para assinatura
  doc.line(15, declaracaoY + 25, 90, declaracaoY + 25);
  doc.setFontSize(9);
  doc.text(funcionario.nome, 15, declaracaoY + 30);
  doc.text(funcionario.cnpj, 15, declaracaoY + 35);

  // Rodapé
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const dataEmissao = new Date().toLocaleDateString('pt-BR');
  doc.text(`Emitido em: ${dataEmissao}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
  doc.text('Este documento comprova o pagamento pelos serviços prestados.', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  // Gerar nome do arquivo
  const nomeArquivo = `recibo_pj_${funcionario.nome.replace(/\s+/g, '_')}_${folha.mes_referencia}.pdf`;
  
  // Fazer download
  doc.save(nomeArquivo);
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
