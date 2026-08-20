import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Comodato } from '@/hooks/useComodatos';

export const generateTermoComodato = (comodato: Comodato): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Cabeçalho
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMO DE RESPONSABILIDADE DE COMODATO', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Linha divisória
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Informações do Item
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. IDENTIFICAÇÃO DO ITEM', margin, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const itemInfo = [
    `Item: ${comodato.item_nome}`,
    comodato.descricao ? `Descrição: ${comodato.descricao}` : null,
    comodato.numero_serie ? `Número de Série: ${comodato.numero_serie}` : null,
    `Quantidade: ${comodato.quantidade}`,
    `Condição na Entrega: ${comodato.condicao_entrega}`,
  ].filter(Boolean);

  itemInfo.forEach((line) => {
    doc.text(line!, margin + 5, yPosition);
    yPosition += 5;
  });
  yPosition += 5;

  // Informações do Comodatário
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. IDENTIFICAÇÃO DO COMODATÁRIO', margin, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome: ${comodato.paciente_nome}`, margin + 5, yPosition);
  yPosition += 5;
  doc.text(`ID do Paciente: ${comodato.paciente_id}`, margin + 5, yPosition);
  yPosition += 10;

  // Informações do Empréstimo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. PERÍODO DO EMPRÉSTIMO', margin, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Data de Empréstimo: ${format(new Date(comodato.data_emprestimo), 'dd/MM/yyyy', { locale: ptBR })}`,
    margin + 5,
    yPosition
  );
  yPosition += 5;
  doc.text(
    `Data de Devolução Prevista: ${format(new Date(comodato.data_devolucao_prevista), 'dd/MM/yyyy', { locale: ptBR })}`,
    margin + 5,
    yPosition
  );
  yPosition += 10;

  // Cláusulas do Termo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('4. CLÁUSULAS E CONDIÇÕES', margin, yPosition);
  yPosition += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const clausulas = [
    {
      titulo: '4.1. OBJETO DO COMODATO',
      texto: 'O presente termo tem por objeto o empréstimo gratuito do(s) item(ns) acima descrito(s), devendo o COMODATÁRIO restituí-lo(s) na data prevista, no mesmo estado em que o recebeu.',
    },
    {
      titulo: '4.2. RESPONSABILIDADE PELA CONSERVAÇÃO',
      texto: 'O COMODATÁRIO obriga-se a conservar o bem como se seu fosse, não podendo usá-lo senão de acordo com o contrato ou a natureza dele. Qualquer dano, perda ou extravio será de inteira responsabilidade do COMODATÁRIO.',
    },
    {
      titulo: '4.3. DANOS E PREJUÍZOS',
      texto: 'Em caso de dano, perda ou extravio do item emprestado, o COMODATÁRIO se compromete a ressarcir integralmente o valor do bem, conforme avaliação do COMODANTE, ou substituí-lo por item equivalente.',
    },
    {
      titulo: '4.4. DEVOLUÇÃO',
      texto: 'O COMODATÁRIO compromete-se a devolver o item na data prevista, no mesmo estado de conservação em que o recebeu, salvo deterioração natural pelo uso adequado. A devolução antecipada poderá ser solicitada a qualquer momento pelo COMODANTE.',
    },
    {
      titulo: '4.5. USO EXCLUSIVO',
      texto: 'O item emprestado destina-se exclusivamente ao uso do COMODATÁRIO, sendo vedado o empréstimo, cessão ou transferência a terceiros sem autorização expressa do COMODANTE.',
    },
    {
      titulo: '4.6. RESCISÃO',
      texto: 'O presente termo poderá ser rescindido a qualquer tempo por interesse do COMODANTE, devendo o COMODATÁRIO devolver o item imediatamente após notificação.',
    },
  ];

  clausulas.forEach((clausula) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(clausula.titulo, margin + 5, yPosition);
    yPosition += 5;

    doc.setFont('helvetica', 'normal');
    const textoLinhas = doc.splitTextToSize(clausula.texto, pageWidth - margin * 2 - 10);
    textoLinhas.forEach((linha: string) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(linha, margin + 5, yPosition);
      yPosition += 4;
    });
    yPosition += 5;
  });

  // Observações
  if (comodato.observacoes) {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('5. OBSERVAÇÕES ADICIONAIS', margin, yPosition);
    yPosition += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const obsLinhas = doc.splitTextToSize(comodato.observacoes, pageWidth - margin * 2 - 10);
    obsLinhas.forEach((linha: string) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(linha, margin + 5, yPosition);
      yPosition += 4;
    });
    yPosition += 10;
  }

  // Adicionar nova página para assinatura se necessário
  if (yPosition > pageHeight - 70) {
    doc.addPage();
    yPosition = margin;
  }

  // Espaço para assinatura
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Data de Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
    margin,
    yPosition
  );
  yPosition += 15;

  // Responsável pelo Comodante
  doc.text('_________________________________________________', margin, yPosition);
  yPosition += 5;
  doc.text(`${comodato.responsavel_nome}`, margin, yPosition);
  yPosition += 4;
  doc.setFontSize(8);
  doc.text('Responsável pelo Comodante', margin, yPosition);
  yPosition += 15;

  // Comodatário
  doc.setFontSize(10);
  doc.text('_________________________________________________', margin, yPosition);
  yPosition += 5;
  doc.text(`${comodato.paciente_nome}`, margin, yPosition);
  yPosition += 4;
  doc.setFontSize(8);
  doc.text('Comodatário (Paciente ou Responsável Legal)', margin, yPosition);

  // Rodapé
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Este documento possui validade jurídica e deve ser arquivado para consulta futura.',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc;
};

export const downloadTermoComodato = (comodato: Comodato) => {
  const doc = generateTermoComodato(comodato);
  const fileName = `termo-comodato-${comodato.paciente_nome.replace(/\s+/g, '-')}-${format(
    new Date(),
    'ddMMyyyy'
  )}.pdf`;
  doc.save(fileName);
};

export const getTermoComodatoPDFBytes = (comodato: Comodato): Uint8Array => {
  const doc = generateTermoComodato(comodato);
  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
};
