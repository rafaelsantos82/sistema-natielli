# Apêndice A — Glossário

| Termo | Definição |
|-------|-----------|
| **Unidade** | Filial clínica (`unidades`); contexto ativo no header SPA |
| **Consulta** | Agendamento clínico (`consultas`); não confundir com "consulta HTTP" |
| **Terapia** | Tipo de tratamento/serviço (ex. fisioterapia); tabela `terapias` |
| **Profissional** | Terapeuta/clinico cadastrado em `profissionais` |
| **RBAC** | Role-Based Access Control — roles + permissões string |
| **Data scope** | Filtro automático de linhas por unidade/vínculo do usuário |
| **Soft delete** | `deleted_at` preenchido; registro oculto mas restaurável |
| **Bearer token** | JWT enviado em `Authorization: Bearer` |
| **Feature flag** | `VITE_API_*` controlando integração com backend |
| **Wave 1–3** | Ondas de entrega de módulos backend no `register.go` |
| **Prontuário** | Registro clínico longitudinal do paciente |
| **Status atendimento** | Máquina de estados pós-consulta até aprovação gestor |
| **Chave digital** | Par de chaves do usuário para assinatura de documentos |
| **Comodato** | Empréstimo de ativos/equipamentos |
