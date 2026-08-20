import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ClinicalScopeBanner } from '@/components/common/ClinicalScopeBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { useProntuario, Prontuario } from '@/hooks/useProntuario';
import { useConsultas } from '@/hooks/useConsultas';
import { FileText, Search, Calendar, Pill, FileCheck, Upload, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Prontuarios() {
  const navigate = useNavigate();
  const { getProntuario } = useProntuario();
  const { consultas } = useConsultas();
  const [searchTerm, setSearchTerm] = useState('');

  // Obter todos os prontuários do localStorage
  const allProntuarios = useMemo(() => {
    const stored = localStorage.getItem('prontuarios');
    if (!stored) return {};
    return JSON.parse(stored) as Record<string, Prontuario>;
  }, [consultas]); // Re-compute when consultas change

  // Transformar em array e adicionar informações da última consulta
  const prontuariosData = useMemo(() => {
    return Object.values(allProntuarios).map((prontuario) => {
      // Encontrar todas as consultas deste paciente
      const pacienteConsultas = consultas.filter(
        (c) => c.pacienteId === prontuario.pacienteId
      );

      // Última consulta
      const ultimaConsulta = pacienteConsultas.sort(
        (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
      )[0];

      return {
        ...prontuario,
        totalEvolucoes: prontuario.evolucoes.length,
        totalPrescricoes: prontuario.prescricoes.length,
        totalAtestados: prontuario.atestados.length,
        totalDocumentos: prontuario.documentos.length,
        ultimaAtualizacao: ultimaConsulta?.dataHora || prontuario.evolucoes[0]?.data || new Date().toISOString(),
        ultimaConsultaId: ultimaConsulta?.id,
      };
    });
  }, [allProntuarios, consultas]);

  // Filtrar prontuários
  const filteredProntuarios = useMemo(() => {
    if (!searchTerm) return prontuariosData;
    const term = searchTerm.toLowerCase();
    return prontuariosData.filter((p) =>
      p.pacienteNome.toLowerCase().includes(term) ||
      p.pacienteId.toLowerCase().includes(term)
    );
  }, [prontuariosData, searchTerm]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalProntuarios = prontuariosData.length;
    const totalEvolucoes = prontuariosData.reduce((sum, p) => sum + p.totalEvolucoes, 0);
    const totalPrescricoes = prontuariosData.reduce((sum, p) => sum + p.totalPrescricoes, 0);
    const totalDocumentos = prontuariosData.reduce((sum, p) => sum + p.totalDocumentos, 0);

    return {
      totalProntuarios,
      totalEvolucoes,
      totalPrescricoes,
      totalDocumentos,
    };
  }, [prontuariosData]);

  const handleViewProntuario = (prontuario: typeof prontuariosData[0]) => {
    if (prontuario.ultimaConsultaId) {
      navigate(`/prontuario/${prontuario.ultimaConsultaId}`);
    } else {
      // Se não houver consulta, buscar a primeira consulta do paciente
      const consulta = consultas.find((c) => c.pacienteId === prontuario.pacienteId);
      if (consulta) {
        navigate(`/prontuario/${consulta.id}`);
      }
    }
  };

  const columns = [
    {
      key: 'pacienteNome',
      label: 'Paciente',
      render: (item: typeof prontuariosData[0]) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{item.pacienteNome}</p>
            <p className="text-xs text-muted-foreground">ID: {item.pacienteId.slice(0, 8)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'totalEvolucoes',
      label: 'Evoluções',
      render: (item: typeof prontuariosData[0]) => (
        <Badge variant="outline" className="gap-1">
          <FileText className="h-3 w-3" />
          {item.totalEvolucoes}
        </Badge>
      ),
    },
    {
      key: 'totalPrescricoes',
      label: 'Prescrições',
      render: (item: typeof prontuariosData[0]) => (
        <Badge variant="outline" className="gap-1">
          <Pill className="h-3 w-3" />
          {item.totalPrescricoes}
        </Badge>
      ),
    },
    {
      key: 'totalAtestados',
      label: 'Atestados',
      render: (item: typeof prontuariosData[0]) => (
        <Badge variant="outline" className="gap-1">
          <FileCheck className="h-3 w-3" />
          {item.totalAtestados}
        </Badge>
      ),
    },
    {
      key: 'totalDocumentos',
      label: 'Documentos',
      render: (item: typeof prontuariosData[0]) => (
        <Badge variant="outline" className="gap-1">
          <Upload className="h-3 w-3" />
          {item.totalDocumentos}
        </Badge>
      ),
    },
    {
      key: 'ultimaAtualizacao',
      label: 'Última Atualização',
      render: (item: typeof prontuariosData[0]) => (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            {format(new Date(item.ultimaAtualizacao), "dd/MM/yyyy", { locale: ptBR })}
          </div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(item.ultimaAtualizacao), "HH:mm", { locale: ptBR })}
          </p>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Prontuários">
      <div className="space-y-6">
        <ClinicalScopeBanner />
        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Prontuários</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProntuarios}</div>
              <p className="text-xs text-muted-foreground">Pacientes com prontuário</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evoluções Registradas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvolucoes}</div>
              <p className="text-xs text-muted-foreground">Total de evoluções</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prescrições Emitidas</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrescricoes}</div>
              <p className="text-xs text-muted-foreground">Total de prescrições</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos Anexados</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDocumentos}</div>
              <p className="text-xs text-muted-foreground">Total de anexos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Prontuários</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou ID do paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {filteredProntuarios.length === 0 ? (
              <div className="text-center py-12">
                {searchTerm ? (
                  <>
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum prontuário encontrado para "{searchTerm}"
                    </p>
                  </>
                ) : (
                  <>
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Nenhum prontuário cadastrado</p>
                    <p className="text-sm text-muted-foreground">
                      Os prontuários são criados automaticamente quando você registra uma evolução em uma consulta
                    </p>
                    <Button
                      onClick={() => navigate('/consultas')}
                      className="mt-4"
                      variant="outline"
                    >
                      Ir para Consultas
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredProntuarios}
                onView={handleViewProntuario}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
