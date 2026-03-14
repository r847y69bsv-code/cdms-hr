# Tarefas de Desenvolvimento — CDMS-HR

## Visão Geral das Fases

| Fase | Descrição | Duração | Dependências |
|:----:|-----------|:-------:|:------------:|
| 1 | Setup e Fundação | 2 semanas | — |
| 2 | Módulo Central de Avaliação | 4 semanas | Fase 1 |
| 3 | Workflow e Aprovação | 3 semanas | Fase 2 |
| 4 | Dashboard e Relatórios | 3 semanas | Fase 2 |
| 5 | Contestação e PMI | 2 semanas | Fase 3 |
| 6 | Testes e Deployment | 2 semanas | Fases 1-5 |

**Total: 16 semanas (4 meses)**

---

## Fase 1 — Setup e Fundação (2 semanas)

### Backend

- [ ] **T1.1** Criar projecto Laravel 11 (`composer create-project laravel/laravel cdms-hr-backend`)
- [ ] **T1.2** Configurar `.env` com SQL Server (`DB_CONNECTION=sqlsrv`, `DB_DATABASE=cdms_hr`)
- [ ] **T1.3** Instalar dependências: `sanctum`, `spatie/laravel-permission`, `ldaprecord-laravel`, `spatie/laravel-activitylog`, `maatwebsite/excel`, `l5-swagger`
- [ ] **T1.4** Publicar configs: Sanctum, Spatie Permission, LDAPRecord, Activity Log
- [ ] **T1.5** Criar migration `users` (com campos `ldap_guid`, `is_active`, `password_expires_at`)
- [ ] **T1.6** Criar migration `ciclos_avaliacao`
- [ ] **T1.7** Criar migration `trabalhadores`
- [ ] **T1.8** Criar migration `indicadores`
- [ ] **T1.9** Criar migration `matriz_pesos`
- [ ] **T1.10** Criar migration `avaliacoes`
- [ ] **T1.11** Criar migration `itens_avaliacao`
- [ ] **T1.12** Criar migration `contestacoes`
- [ ] **T1.13** Criar migration `registos_one_on_one`
- [ ] **T1.14** Criar migration `planos_melhoria`
- [ ] **T1.15** Criar migration `registos_auditoria`
- [ ] **T1.16** Criar Models Eloquent (todos os 11 models com relationships, casts, fillable)
- [ ] **T1.17** Criar `IndicadorSeeder` com os 6 indicadores
- [ ] **T1.18** Criar `MatrizPesosSeeder` com pesos de todas as 13 categorias de Líderes + Não Líderes
- [ ] **T1.19** Criar `RoleSeeder` (5 papéis: trabalhador, avaliador, chefe-departamento, gestor-rh, admin)
- [ ] **T1.20** Criar `PermissionSeeder` com todas as permissões definidas no ARCHITECTURE.md
- [ ] **T1.21** Implementar `AuthController` (login local + logout)
- [ ] **T1.22** Implementar login LDAP (`LdapUserController::ldaplogin`)
- [ ] **T1.23** Criar middleware `CheckIfUserIsActive` e `CheckPasswordExpiry` (copiar padrão CDMS Supplier)
- [ ] **T1.24** Configurar `routes/api.php` com estrutura base (auth routes + middleware group)
- [ ] **T1.25** Executar `php artisan migrate --seed` e validar esquema

### Frontend

- [ ] **T1.26** Criar projecto Next.js 14 (`npx create-next-app@14 cdms-hr-frontend --typescript`)
- [ ] **T1.27** Instalar dependências: `primereact`, `primeflex`, `primeicons`, `axios`, `cookies-next`, `next-intl`, `chart.js`, `@react-pdf/renderer`, `exceljs`, `sass`
- [ ] **T1.28** Copiar template Sakai do CDMS Supplier: `layout/` (layout.tsx, AppTopbar, AppSidebar, AppMenu, AppFooter, contexts)
- [ ] **T1.29** Copiar tema `lara-light-indigo` para `public/themes/`
- [ ] **T1.30** Copiar utilitários `utils/auth.ts` e `utils/index.ts` (adaptando cookie name para `cdmshr_userjwt`)
- [ ] **T1.31** Criar `app/api/index.ts` (instância Axios centralizada)
- [ ] **T1.32** Copiar componentes `RestrictedRoute.tsx` e `ProtectedRoute.tsx`
- [ ] **T1.33** Configurar `next-intl` com ficheiro `messages/pt.json` (estrutura base)
- [ ] **T1.34** Criar route groups: `(full-page)` e `(main)` com seus layouts
- [ ] **T1.35** Criar página de login `(full-page)/auth/login/page.tsx`
- [ ] **T1.36** Criar `AppMenu.tsx` com estrutura de menu CDMS-HR (permissões)
- [ ] **T1.37** Testar fluxo completo: login → menu lateral → página protegida
- [ ] **T1.38** Configurar `next.config.js` e variáveis de ambiente `.env.local`

---

## Fase 2 — Módulo Central de Avaliação (4 semanas)

### Backend — Ciclos e Configuração

- [ ] **T2.1** Criar `CicloAvaliacaoController` (CRUD completo + activar/fechar)
- [ ] **T2.2** Criar `IndicadorController` (CRUD)
- [ ] **T2.3** Criar `MatrizPesosController` (CRUD batch + copiar entre ciclos)
- [ ] **T2.4** Criar Form Requests de validação para cada controller
- [ ] **T2.5** Registar rotas API para ciclos, indicadores e pesos

### Backend — Trabalhadores e Importação

- [ ] **T2.6** Criar `TrabalhadorController` (listagem, perfil, subordinados, por departamento)
- [ ] **T2.7** Criar `PositionBatchImport` (Maatwebsite Excel) — mapear colunas do Excel
- [ ] **T2.8** Implementar lógica de importação: criar/actualizar trabalhadores, determinar `e_lider`, mapear `report_to_id`
- [ ] **T2.9** Relatório de importação com erros e warnings
- [ ] **T2.10** Endpoint POST `/trabalhadores/importar` com FileUpload

### Backend — Avaliações (CRUD)

- [ ] **T2.11** Criar `AvaliacaoController` — `index`, `store`, `show`, `update`
- [ ] **T2.12** Criar `AvaliacaoService::calcularPontuacao()` — obter pesos, aplicar multiplicadores, somar
- [ ] **T2.13** Implementar `store` — criar avaliação com itens, pré-preencher pesos da MatrizPesos
- [ ] **T2.14** Implementar `update` — actualizar classificações e comentários (auto ou avaliador)
- [ ] **T2.15** Endpoints: `/avaliacoes/minhas`, `/avaliacoes/pendentes-avaliador`
- [ ] **T2.16** Filtros e paginação server-side (ciclo, estado, departamento, search)

### Frontend — Gestão de Ciclos (RH)

- [ ] **T2.17** Página `/rh/ciclos/page.tsx` — DataTable com listagem de ciclos
- [ ] **T2.18** Dialog para criar/editar ciclo (formulário com validação)
- [ ] **T2.19** Botões activar/fechar ciclo com confirmação

### Frontend — Configuração de Indicadores e Pesos (RH)

- [ ] **T2.20** Página `/rh/configuracao/page.tsx` — TabView com indicadores e pesos
- [ ] **T2.21** Tab Indicadores: DataTable editável
- [ ] **T2.22** Tab Pesos: tabela matricial editável (categorias × indicadores)
- [ ] **T2.23** Funcionalidade copiar pesos do ciclo anterior

### Frontend — Importação Position Batch (RH)

- [ ] **T2.24** Página ou Dialog para upload do ficheiro Excel
- [ ] **T2.25** Componente FileUpload (PrimeReact) + barra de progresso
- [ ] **T2.26** Exibir relatório de importação (sucesso/erros)

### Frontend — Formulário de Autoavaliação (PÁGINA CRÍTICA)

- [ ] **T2.27** Página `/avaliacoes/nova/page.tsx` — formulário principal
- [ ] **T2.28** Dados pré-preenchidos do trabalhador (nome, dept., cargo, função, chefe)
- [ ] **T2.29** Detecção automática Líder/Não Líder (mostrar/ocultar indicador Liderança)
- [ ] **T2.30** Componente `PainelIndicador.tsx` — para cada indicador: texto descritivo + Dropdown + InputTextarea
- [ ] **T2.31** Indicador Ética: SelectButton Sim/Não + campo de justificação condicional
- [ ] **T2.32** Campo "Aspectos a Desenvolver/Melhorar" (InputTextarea)
- [ ] **T2.33** Componente `ResumoCalculo.tsx` — cálculo em tempo real das pontuações ponderadas
- [ ] **T2.34** Botão "Guardar Rascunho" e botão "Submeter" (com Dialog de confirmação)
- [ ] **T2.35** Validação: todos os campos obrigatórios preenchidos antes de submeter

### Frontend — Lista de Avaliações

- [ ] **T2.36** Página `/avaliacoes/historico/page.tsx` — DataTable lazy com minhas avaliações
- [ ] **T2.37** Tag de estado com cores (PrimeReact Tag)
- [ ] **T2.38** Botão ver detalhe → página `/avaliacoes/[id]/page.tsx`

### Frontend — Painel do Avaliador

- [ ] **T2.39** Página `/avaliador/pendentes/page.tsx` — avaliações pendentes dos subordinados
- [ ] **T2.40** Página `/avaliador/equipa/page.tsx` — lista completa da equipa
- [ ] **T2.41** Formulário do avaliador: layout duas colunas (autoavaliação read-only à esquerda, avaliador à direita)
- [ ] **T2.42** Cálculo automático de pontuação ponderada em tempo real
- [ ] **T2.43** Botão "Guardar Rascunho" e "Submeter ao Chefe de Departamento"

---

## Fase 3 — Workflow e Aprovação (3 semanas)

### Backend

- [ ] **T3.1** Criar `WorkflowService` — máquina de estados com transições validadas
- [ ] **T3.2** Implementar acções de workflow no `AvaliacaoController`: `submeterAutoavaliacao`, `submeterAvaliador`, `aprovarDepartamento`, `devolverDepartamento`, `aprovarRH`, `devolverRH`
- [ ] **T3.3** Em cada transição: validar estado actual → novo estado, actualizar timestamps
- [ ] **T3.4** Registar cada transição na tabela `registos_auditoria`
- [ ] **T3.5** Criar Notifications Laravel: `AvaliacaoSubmetidaNotification`, `AvaliacaoAprovadaNotification`, `AvaliacaoDevolvida Notification`, `PrazoContestacaoNotification`
- [ ] **T3.6** Implementar endpoint de notificações (listar, marcar lida, contar)
- [ ] **T3.7** Configurar mail driver para envio de emails

### Frontend — Revisão Departamental

- [ ] **T3.8** Página `/departamento/aprovacoes/page.tsx` — avaliações pendentes do departamento
- [ ] **T3.9** Página `/departamento/resumo/page.tsx` — resumo departamental
- [ ] **T3.10** Visualização completa da avaliação (auto + avaliador, read-only)
- [ ] **T3.11** Botões "Aprovar" e "Devolver" (com Dialog para comentários na devolução)

### Frontend — Módulo RH

- [ ] **T3.12** Página `/rh/todas-avaliacoes/page.tsx` — DataTable com todas as avaliações
- [ ] **T3.13** Filtros avançados: ciclo, departamento, estado, pesquisa por nome
- [ ] **T3.14** Aprovação final RH (aprovar / devolver com comentários)

### Frontend — Notificações

- [ ] **T3.15** Componente de notificações no AppTopbar (badge + OverlayPanel)
- [ ] **T3.16** Lista de notificações com marcar como lida
- [ ] **T3.17** Polling ou WebSocket para actualização em tempo real

### Frontend — Indicador Visual de Workflow

- [ ] **T3.18** Componente `Steps` mostrando o progresso da avaliação (etapa actual destacada)
- [ ] **T3.19** Componente `Timeline` com histórico de transições de estado

---

## Fase 4 — Dashboard e Relatórios (3 semanas)

### Backend

- [ ] **T4.1** Criar `DashboardController` com endpoints: `/dashboard/rh`, `/dashboard/departamento`, `/dashboard/avaliador`
- [ ] **T4.2** Queries optimizadas: contagens por estado, por departamento, médias
- [ ] **T4.3** Criar `RelatorioController` — endpoint de exportação Excel (Maatwebsite Excel)
- [ ] **T4.4** Endpoint `/relatorios/pdf/{id}` — retornar dados formatados para geração de PDF no frontend

### Frontend — Dashboard RH

- [ ] **T4.5** Página `/dashboard/page.tsx` — adaptada ao papel do utilizador
- [ ] **T4.6** Cards resumo: total trabalhadores, avaliações submetidas, % conclusão, pontuação média
- [ ] **T4.7** Gráfico de barras: concluídas vs. pendentes por departamento (Chart.js)
- [ ] **T4.8** Gráfico circular: distribuição por estado
- [ ] **T4.9** Tabela de departamentos com métricas
- [ ] **T4.10** Filtro por ciclo de avaliação
- [ ] **T4.11** Alerta de violações éticas

### Frontend — Dashboard Departamental

- [ ] **T4.12** Dashboard simplificado para chefe de departamento
- [ ] **T4.13** Lista de acções pendentes

### Frontend — Geração de PDF

- [ ] **T4.14** Componente `PDFAvaliacao.tsx` com @react-pdf/renderer
- [ ] **T4.15** Layout do PDF replica o formulário Excel actual:
  - Cabeçalho Cornelder
  - Dados do trabalhador
  - Tabela de indicadores (duas colunas)
  - Pontuação final
  - Ética
  - Aspectos a melhorar
  - 4 linhas de assinatura
- [ ] **T4.16** Botão "Imprimir PDF" na página de detalhe da avaliação aprovada
- [ ] **T4.17** Botão "Exportar PDF em Lote" no módulo RH

### Frontend — Exportação Excel

- [ ] **T4.18** Botão "Exportar Excel" no módulo RH com filtros
- [ ] **T4.19** Download do ficheiro Excel gerado pelo backend

---

## Fase 5 — Contestação e PMI (2 semanas)

### Backend

- [ ] **T5.1** Criar `ContestacaoController` (submeter, responder)
- [ ] **T5.2** Validação: apenas dentro de 7 dias após aprovação
- [ ] **T5.3** Criar `PlanoMelhoriaController` (CRUD)
- [ ] **T5.4** Criar `OneOnOneController` (CRUD, listar por avaliação)

### Frontend — Contestação

- [ ] **T5.5** Na página de detalhe da avaliação aprovada: botão "Contestar" (visível apenas nos 7 dias)
- [ ] **T5.6** Dialog de contestação: textarea + botão submeter
- [ ] **T5.7** Countdown visual do prazo de 7 dias
- [ ] **T5.8** Página de gestão de contestações (chefe dept. e RH)
- [ ] **T5.9** Resposta à contestação com justificação

### Frontend — Plano de Melhoria Individual (PMI)

- [ ] **T5.10** Tab ou secção na avaliação: áreas de melhoria, acções, metas, apoio/recursos
- [ ] **T5.11** Avaliador ou RH podem criar/editar o plano

### Frontend — Reuniões One-on-One

- [ ] **T5.12** Página `/one-on-one/page.tsx` — listar e registar reuniões
- [ ] **T5.13** Formulário: trimestre (T1/T2/T3), data, pontos de discussão, acções
- [ ] **T5.14** Ligação à avaliação do trabalhador (histórico visível)

---

## Fase 6 — Testes e Deployment (2 semanas)

### Testes

- [ ] **T6.1** Testes unitários backend: `AvaliacaoService::calcularPontuacao()` — testar todas as categorias
- [ ] **T6.2** Testes unitários backend: `WorkflowService` — testar todas as transições (válidas e inválidas)
- [ ] **T6.3** Testes feature backend: fluxo completo de avaliação (criar → submeter → aprovar)
- [ ] **T6.4** Testes de permissões: verificar que cada endpoint rejeita utilizadores sem permissão
- [ ] **T6.5** UAT com equipa de RH (ambiente de staging)
- [ ] **T6.6** Correcção de bugs encontrados no UAT
- [ ] **T6.7** Teste de carga: verificar performance com 1.762 trabalhadores

### Deployment

- [ ] **T6.8** Criar base de dados `cdms_hr` no servidor SQL Server de produção
- [ ] **T6.9** Configurar backend em produção (nginx/apache, .env produção, LDAP)
- [ ] **T6.10** Build do frontend (`next build`) e deploy
- [ ] **T6.11** Executar migrações e seeders em produção
- [ ] **T6.12** Importar Position Batch real
- [ ] **T6.13** Criar utilizadores iniciais e atribuir papéis
- [ ] **T6.14** Testes de smoke em produção

### Formação e Documentação

- [ ] **T6.15** Sessão de formação para equipa de RH
- [ ] **T6.16** Sessão de formação para avaliadores/chefes de departamento
- [ ] **T6.17** Guia do utilizador in-app (se aplicável)

---

## Prioridades e Dependências Críticas

### Caminho Crítico
```
T1.1-T1.25 (Backend setup)
    → T2.11-T2.16 (Avaliações CRUD)
        → T2.27-T2.35 (Formulário autoavaliação - PÁGINA MAIS IMPORTANTE)
            → T3.1-T3.7 (Workflow)
                → T4.1-T4.4 (Dashboard backend)
```

### Desenvolvimento Paralelo Possível
- Frontend setup (T1.26-T1.38) em paralelo com backend setup (T1.1-T1.25)
- Dashboard (Fase 4) em paralelo com Workflow (Fase 3) — dados mock no início
- Contestação/PMI (Fase 5) em paralelo com Relatórios (parte da Fase 4)

### Componente Mais Crítico
O **Formulário de Avaliação** (T2.27-T2.35 e T2.41-T2.43) é a página mais complexa e importante do sistema. Dedicar tempo extra ao design e testes desta página.
