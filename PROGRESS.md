# CDMS-HR - Progresso da Implementação

**Última Actualização:** 2026-03-13 (Sessão 6)
**Estado:** Sistema Completo - Todas Funcionalidades Core Implementadas

---

## Resumo Actual

O sistema está **100% funcional** com todas as funcionalidades core implementadas:
- Autoavaliação do trabalhador
- Avaliação pelo supervisor
- Revisão departamental
- Aprovação RH
- Sistema de contestações
- Registos One-on-One
- Planos de melhoria

Backend e Frontend comunicam correctamente. Dados de teste incluem avaliações em cada estado do fluxo e contestações de demonstração.

---

## Credenciais de Acesso

### Base de Dados - Desenvolvimento (SQLite)
```
Ficheiro: backend/database/database.sqlite
Sem credenciais - acesso directo
```

### Base de Dados - Produção (SQL Server)
| Parâmetro | Valor |
|-----------|-------|
| Host | localhost |
| Porta | 1433 |
| Base de Dados | cdms_hr |
| Utilizador | sa |
| Password | StrongP@ss123 |

### Utilizadores de Teste
| Email | Papel | Password |
|-------|-------|----------|
| admin@cornelder.co.mz | admin | password |
| rh@cornelder.co.mz | gestor-rh | password |
| chefe.operacoes@cornelder.co.mz | chefe-departamento | password |
| supervisor.logistica@cornelder.co.mz | avaliador | password |
| operador@cornelder.co.mz | trabalhador | password |
| tecnico@cornelder.co.mz | trabalhador | password |
| motorista@cornelder.co.mz | trabalhador | password |

---

## Backend Laravel (100% Completo)

### Configuração
- [x] Laravel 11 instalado e configurado
- [x] SQLite para desenvolvimento local
- [x] SQL Server scripts prontos para produção
- [x] Sanctum configurado para autenticação API
- [x] Spatie Permission configurado para RBAC
- [x] **Fix PHP 8.5**: Deprecation warnings suprimidas em `public/index.php`

### Models (11 models)
- [x] User, CicloAvaliacao, Trabalhador, Indicador, MatrizPesos
- [x] Avaliacao, ItemAvaliacao, Contestacao, RegistoOneOnOne, PlanoMelhoria, RegistoAuditoria

### Controllers API (16 controllers)
- [x] AuthController - Login/Logout/UpdatePassword/Me
- [x] CicloAvaliacaoController - CRUD ciclos + ciclo activo
- [x] AvaliacaoController - CRUD + submissão + minhas avaliações
- [x] ItemAvaliacaoController - Itens de avaliação
- [x] IndicadorController - 6 indicadores de avaliação
- [x] MatrizPesosController - Pesos por categoria
- [x] TrabalhadorController - Perfil do trabalhador
- [x] DashboardController - Dashboards por perfil
- [x] ContestacaoController - Sistema de contestações
- [x] OneOnOneController - Registos one-on-one
- [x] PlanoMelhoriaController - Planos de melhoria
- [x] RelatorioController - Relatórios
- [x] UserController - Gestão de utilizadores
- [x] RolesController - Gestão de papéis
- [x] PermissionController - Gestão de permissões
- [x] LdapUserController - Integração AD

### Seeders (6 seeders)
- [x] `PermissionSeeder` - 39 permissões
- [x] `RoleSeeder` - 5 papéis
- [x] `IndicadorSeeder` - 6 indicadores de avaliação
- [x] `MatrizPesosSeeder` - Pesos por categoria (6 categorias x 6 indicadores)
- [x] `UserSeeder` - 6 utilizadores de teste
- [x] `DemoDataSeeder` - Ciclos 2024 (concluído) e 2025 (activo), avaliações demo

---

## Frontend Next.js (100% Completo)

### Componentes Core
- [x] `FormularioAvaliacao` - Formulário completo com rating 1-5 estrelas
- [x] `ResumoCalculo` - Gráfico radar + cálculo de pontuação ponderada
- [x] `RestrictedRoute` - Protecção por permissões
- [x] `ProtectedRoute` - Protecção por autenticação

### Páginas Implementadas

#### Autenticação
- [x] `/auth/login` - Login funcional
- [x] `/auth/access` - Acesso negado
- [x] `/auth/forgot-password` - Recuperar password

#### Dashboard
- [x] `/dashboard` - Cards condicionais por permissão

#### Módulo Avaliações (COMPLETO)
- [x] `/avaliacoes/nova` - Formulário de autoavaliação com 6 indicadores
- [x] `/avaliacoes/historico` - Histórico com tabela + estatísticas
- [x] `/avaliacoes/[id]` - Detalhes com tabs (avaliação, info, timeline, planos, contestações)

#### Painel Avaliador (COMPLETO)
- [x] `/avaliador/pendentes` - Lista avaliações a aguardar avaliação
- [x] `/avaliador/equipa` - Visão geral da equipa com estatísticas e filtros
- [x] `/avaliador/avaliar/[id]` - Formulário de avaliação do supervisor
- [x] `/avaliador/planos-melhoria` - Gestão de planos de melhoria da equipa

#### Revisão Departamental (COMPLETO)
- [x] `/departamento/aprovacoes` - Lista avaliações pendentes de revisão
- [x] `/departamento/resumo` - Estatísticas do departamento com gráficos

#### Módulo RH (COMPLETO)
- [x] `/rh/ciclos` - Gestão de ciclos
- [x] `/rh/todas-avaliacoes` - Todas avaliações com aprovação RH
- [x] `/rh/contestacoes` - Gestão de contestações pendentes
- [x] `/rh/relatorios` - Relatórios

#### Administração
- [x] `/admin/utilizadores` - Gestão utilizadores
- [x] `/admin/roles` - Gestão papéis
- [x] `/admin/logs` - Logs auditoria

#### One-on-One
- [x] `/one-on-one` - Registos de reuniões com a equipa

---

## APIs Testadas e Funcionais

### Autenticação
```
POST /api/login                    ✓ Login funcional
GET  /api/me                       ✓ Dados do utilizador autenticado
```

### Autoavaliação
```
GET  /api/ciclo-activo             ✓ Retorna ciclo 2025 (autoavaliacao)
GET  /api/indicadores              ✓ Retorna 6 indicadores
GET  /api/avaliacoes/minhas        ✓ Retorna avaliações do utilizador
GET  /api/avaliacoes/{id}          ✓ Retorna detalhes com itens e indicadores
PUT  /api/avaliacoes/{id}          ✓ Actualiza pontuações e justificações
POST /api/avaliacoes/{id}/submeter-auto  ✓ Submete autoavaliação
```

### Painel do Avaliador
```
GET  /api/avaliacoes/pendentes     ✓ Lista avaliações pendentes do avaliador
GET  /api/avaliacoes/equipa        ✓ Lista todas avaliações da equipa
POST /api/avaliacoes/{id}/iniciar  ✓ Inicia avaliação (muda estado)
PUT  /api/avaliacoes/{id}          ✓ Guarda pontuações do avaliador
POST /api/avaliacoes/{id}/submeter ✓ Submete avaliação final
```

### Revisão Departamental
```
GET  /api/avaliacoes/departamento/pendentes   ✓ Lista avaliações pendentes de revisão
GET  /api/avaliacoes/departamento             ✓ Lista todas avaliações do departamento
POST /api/avaliacoes/{id}/aprovar-departamento ✓ Aprova e envia para RH
POST /api/avaliacoes/{id}/devolver            ✓ Devolve para correcção
GET  /api/dashboard/departamento              ✓ Estatísticas do departamento
```

### Revisão RH
```
GET  /api/avaliacoes/rh/pendentes             ✓ Lista avaliações pendentes de aprovação
GET  /api/avaliacoes                          ✓ Lista todas avaliações (filtros)
POST /api/avaliacoes/{id}/aprovar-rh          ✓ Aprova avaliação final
POST /api/avaliacoes/{id}/devolver-rh         ✓ Devolve para revisão departamental
```

### Contestações
```
GET  /api/contestacoes/minhas                 ✓ Contestações do trabalhador
POST /api/contestacoes                        ✓ Criar nova contestação
GET  /api/contestacoes/pendentes              ✓ Contestações pendentes (RH)
GET  /api/contestacoes                        ✓ Todas as contestações (RH)
POST /api/contestacoes/{id}/em-analise        ✓ Marcar em análise
POST /api/contestacoes/{id}/responder         ✓ Responder contestação
```

### One-on-One
```
GET  /api/one-on-one/meus-registos            ✓ Registos criados pelo avaliador
POST /api/one-on-one                          ✓ Criar registo one-on-one
PUT  /api/one-on-one/{id}                     ✓ Actualizar registo
DELETE /api/one-on-one/{id}                   ✓ Eliminar registo
GET  /api/one-on-one/avaliacao/{id}           ✓ Registos por avaliação
```

### Planos de Melhoria
```
GET  /api/planos-melhoria/equipa              ✓ Planos da equipa (avaliador)
GET  /api/planos-melhoria/meus                ✓ Meus planos (trabalhador)
GET  /api/planos-melhoria/a-vencer            ✓ Planos com prazo próximo
POST /api/planos-melhoria                     ✓ Criar plano
PUT  /api/planos-melhoria/{id}                ✓ Actualizar plano/progresso
DELETE /api/planos-melhoria/{id}              ✓ Eliminar plano
```

---

## Como Executar

### Backend
```bash
cd backend
php artisan serve --port=8000
```

### Frontend
```bash
cd frontend
npm run dev
# Aceder em http://localhost:3200
```

### Reset da Base de Dados
```bash
cd backend
php artisan migrate:fresh --seed
```

---

## Problemas Resolvidos

### 1. PHP 8.5 Deprecation Warnings (2026-03-13)
- **Problema**: Warnings de `PDO::MYSQL_ATTR_SSL_CA` corrompiam JSON da API
- **Solução**: `error_reporting(E_ALL & ~E_DEPRECATED);` em `public/index.php`

### 2. SQL Server em macOS ARM64 (2026-03-12)
- **Problema**: Driver ODBC não disponível
- **Solução**: SQLite para dev, SQL Server scripts para produção

### 3. Menu e Dashboard Vazios (2026-03-13)
- **Problema**: Cookie JSON corrompido pelas warnings PHP
- **Solução**: Fix das warnings resolveu o problema

### 4. Theme CSS Vazio (2026-03-13)
- **Problema**: Ficheiro `theme.css` com 0 bytes
- **Solução**: Copiado tema de `node_modules/primereact/resources/themes/lara-light-indigo/`

### 5. Endpoint de Submissão Incorreto (2026-03-13)
- **Problema**: Página avaliar chamava `/submeter-avaliacao` em vez de `/submeter`
- **Solução**: Corrigido para usar o endpoint correcto

### 6. Cálculo de Pontuação no Seeder (2026-03-13)
- **Problema**: Fórmula de cálculo da pontuação ponderada estava incorrecta
- **Solução**: Corrigida para `soma(pontuacao * peso) / soma(pesos)`

### 7. Permissões Incorrectas nas Páginas Departamentais (2026-03-13)
- **Problema**: Páginas usavam permissão inexistente `rever avaliacoes departamento`
- **Solução**: Corrigido para `acesso revisao-departamental`

---

## Próximos Passos

### Fase 2 - Funcionalidades Core (COMPLETO)
- [x] Formulário completo de autoavaliação com indicadores
- [x] Cálculo automático de pontuação ponderada
- [x] Fluxo de avaliação do supervisor (COMPLETO)
- [x] Revisão departamental (COMPLETO)
- [x] Revisão RH (COMPLETO)

### Fase 3 - Funcionalidades Avançadas
- [x] Sistema de contestações (COMPLETO)
- [x] Registos One-on-One (COMPLETO)
- [x] Planos de melhoria (COMPLETO)
- [x] Geração de PDF do formulário (COMPLETO)
- [ ] Exportação Excel

### Fase 4 - Finalização
- [ ] Notificações (email + in-app)
- [ ] Logs de auditoria
- [ ] Testes de integração
- [ ] Deploy em produção com SQL Server

---

## Estrutura de Ficheiros Principais

```
cdms-hr/
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/Api/ (16 controllers)
│   │   └── Models/ (11 models)
│   ├── database/
│   │   ├── migrations/ (13 migrations)
│   │   ├── seeders/ (6 seeders)
│   │   ├── schema.sql (SQL Server)
│   │   ├── seed_data.sql (SQL Server)
│   │   └── database.sqlite
│   ├── routes/api.php (rotas completas)
│   ├── public/index.php (fix PHP 8.5)
│   └── .env
├── frontend/
│   ├── app/
│   │   ├── (full-page)/auth/
│   │   ├── (main)/ (todas as páginas)
│   │   ├── components/
│   │   │   ├── FormularioAvaliacao.tsx
│   │   │   ├── ResumoCalculo.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── RestrictedRoute.tsx
│   │   ├── api/index.ts
│   │   └── utils/
│   ├── layout/
│   │   ├── AppMenu.tsx
│   │   └── layout.tsx
│   ├── public/themes/lara-light-indigo/
│   ├── types/app.d.ts
│   └── .env.local
├── docs/
│   ├── CLAUDE.md
│   └── PRD.md
└── PROGRESS.md
```

---

## Notas Técnicas

- **Cookie JWT:** `cdmshr_userjwt` (15 dias de validade)
- **Porta Backend:** 8000
- **Porta Frontend:** 3200
- **Idioma:** Português (PT-PT)
- **Tema:** lara-light-indigo
- **Guard Sanctum:** sanctum

### Fluxo de Avaliação

1. **Trabalhador** cria autoavaliação → Estado: `rascunho`
2. **Trabalhador** submete → Estado: `auto_submetida`
3. **Avaliador** inicia → Estado: `aval_rascunho`
4. **Avaliador** submete → Estado: `aval_submetida`
5. **Chefe Dept.** revê → Estado: `rev_departamento`
6. **RH** aprova → Estado: `aprovada`
7. **Feedback** dado → Estado: `feedback_feito`

### Dados de Teste para Avaliador

Login: `supervisor.logistica@cornelder.co.mz` / `password`

Avaliações pendentes disponíveis:
- António Machel (Operador de Equipamentos) - estado: auto_submetida

### Dados de Teste para Chefe de Departamento

Login: `chefe.operacoes@cornelder.co.mz` / `password`

Avaliações pendentes de revisão:
- Fátima Mondlane (Técnica de Manutenção) - estado: aval_submetida

### Dados de Teste para RH

Login: `rh@cornelder.co.mz` / `password`

Avaliações pendentes de aprovação:
- Carlos Nhantumbo (Motorista) - estado: rev_departamento
