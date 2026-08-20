import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Consulta } from '@/hooks/useConsultas';
import { Prontuario } from '@/hooks/useProntuario';
import { format } from 'date-fns';

export const generateConsultasReport = (
  consultas: Consulta[],
  filtros: {
    dataInicio?: string;
    dataFim?: string;
    paciente?: string;
    profissional?: string;
  }
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Relatório de Consultas', 14, 22);
  
  // Filters
  doc.setFontSize(10);
  let yPosition = 35;
  
  if (filtros.dataInicio) {
    doc.text(`Período: ${format(new Date(filtros.dataInicio), 'dd/MM/yyyy')} a ${filtros.dataFim ? format(new Date(filtros.dataFim), 'dd/MM/yyyy') : 'Atual'}`, 14, yPosition);
    yPosition += 5;
  }
  
  if (filtros.paciente) {
    doc.text(`Paciente: ${filtros.paciente}`, 14, yPosition);
    yPosition += 5;
  }
  
  if (filtros.profissional) {
    doc.text(`Profissional: ${filtros.profissional}`, 14, yPosition);
    yPosition += 5;
  }

  yPosition += 5;

  // Statistics
  const totalConsultas = consultas.length;
  const consultasRealizadas = consultas.filter(c => c.status === 'concluida').length;
  const consultasCanceladas = consultas.filter(c => c.status === 'cancelada').length;
  const taxaRealizacao = totalConsultas > 0 ? ((consultasRealizadas / totalConsultas) * 100).toFixed(1) : '0';

  doc.text(`Total de Consultas: ${totalConsultas}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Realizadas: ${consultasRealizadas} | Canceladas: ${consultasCanceladas}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Taxa de Realização: ${taxaRealizacao}%`, 14, yPosition);
  
  // Table
  autoTable(doc, {
    startY: yPosition + 5,
    head: [['Data/Hora', 'Paciente', 'Profissional', 'Motivo', 'Status']],
    body: consultas.map(c => [
      format(new Date(c.dataHora), 'dd/MM/yyyy HH:mm'),
      c.pacienteNome,
      c.profissionalNome,
      c.motivo,
      c.status,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 66, 66] },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      `Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  return doc;
};

export const generateProntuarioPDF = (prontuario: Prontuario) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Prontuário Eletrônico', 14, 22);
  
  doc.setFontSize(12);
  doc.text(`Paciente: ${prontuario.pacienteNome}`, 14, 32);
  
  let yPosition = 45;

  // Evoluções
  if (prontuario.evolucoes.length > 0) {
    doc.setFontSize(14);
    doc.text('Evoluções', 14, yPosition);
    yPosition += 5;

    prontuario.evolucoes.forEach((evolucao, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`${format(new Date(evolucao.data), 'dd/MM/yyyy HH:mm')}`, 14, yPosition);
      yPosition += 5;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      
      doc.text('Queixa Principal:', 14, yPosition);
      yPosition += 4;
      const queixaLines = doc.splitTextToSize(evolucao.queixaPrincipal, 180);
      doc.text(queixaLines, 20, yPosition);
      yPosition += queixaLines.length * 4 + 2;

      doc.text('Hipótese Diagnóstica:', 14, yPosition);
      yPosition += 4;
      const hipoteseLines = doc.splitTextToSize(evolucao.hipoteseDiagnostica, 180);
      doc.text(hipoteseLines, 20, yPosition);
      yPosition += hipoteseLines.length * 4 + 2;

      doc.text('Conduta:', 14, yPosition);
      yPosition += 4;
      const condutaLines = doc.splitTextToSize(evolucao.conduta, 180);
      doc.text(condutaLines, 20, yPosition);
      yPosition += condutaLines.length * 4 + 5;
    });
    
    yPosition += 5;
  }

  // Prescrições
  if (prontuario.prescricoes.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('Prescrições', 14, yPosition);
    yPosition += 10;

    autoTable(doc, {
      startY: yPosition,
      head: [['Data', 'Medicamento', 'Dosagem', 'Frequência', 'Duração']],
      body: prontuario.prescricoes.map(p => [
        format(new Date(p.data), 'dd/MM/yyyy'),
        p.medicamento,
        p.dosagem,
        p.frequencia,
        p.duracao,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Atestados
  if (prontuario.atestados.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('Atestados', 14, yPosition);
    yPosition += 10;

    autoTable(doc, {
      startY: yPosition,
      head: [['Data', 'CID', 'Dias', 'Início', 'Fim']],
      body: prontuario.atestados.map(a => [
        format(new Date(a.data), 'dd/MM/yyyy'),
        a.cid,
        a.diasAfastamento.toString(),
        format(new Date(a.dataInicio), 'dd/MM/yyyy'),
        format(new Date(a.dataFim), 'dd/MM/yyyy'),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
    });
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      `Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  return doc;
};

export const generateAtestadoPDF = (
  atestado: {
    pacienteNome: string;
    profissionalNome: string;
    profissionalCRM: string;
    cid: string;
    diasAfastamento: number;
    dataInicio: string;
    dataFim: string;
    observacoes?: string;
  }
) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('ATESTADO MÉDICO', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
  
  doc.setFontSize(12);
  let yPosition = 60;
  
  const text = `Atesto para os devidos fins que o(a) paciente ${atestado.pacienteNome} esteve sob meus cuidados profissionais e necessita de afastamento de suas atividades habituais pelo período de ${atestado.diasAfastamento} dia(s), de ${format(new Date(atestado.dataInicio), 'dd/MM/yyyy')} a ${format(new Date(atestado.dataFim), 'dd/MM/yyyy')}.`;
  
  const lines = doc.splitTextToSize(text, 170);
  doc.text(lines, 20, yPosition);
  yPosition += lines.length * 7 + 10;
  
  doc.text(`CID: ${atestado.cid}`, 20, yPosition);
  yPosition += 10;
  
  if (atestado.observacoes) {
    doc.text('Observações:', 20, yPosition);
    yPosition += 7;
    const obsLines = doc.splitTextToSize(atestado.observacoes, 170);
    doc.text(obsLines, 20, yPosition);
    yPosition += obsLines.length * 7 + 10;
  }
  
  yPosition += 30;
  
  doc.text(format(new Date(), 'dd/MM/yyyy'), 20, yPosition);
  
  yPosition += 20;
  
  doc.line(20, yPosition, 100, yPosition);
  yPosition += 5;
  doc.text(atestado.profissionalNome, 20, yPosition);
  yPosition += 5;
  doc.text(`CRM: ${atestado.profissionalCRM}`, 20, yPosition);
  
  return doc;
};
