# CDMS-HR — Módulo de Avaliação de Desempenho

## Visão Geral do Projecto

O CDMS-HR é um módulo web de Avaliação de Desempenho para a Cornelder de Moçambique. Digitaliza o processo de avaliação anual definido na Ordem de Serviço N.º 13 de 2025, substituindo o actual fluxo baseado em Excel.

A aplicação é inteiramente em **Português (PT-PT)** — menus, formulários, mensagens, notificações e relatórios.

## Stack Tecnológica

### Frontend

- **Next.js 14+** (App Router) com **TypeScript**
- **PrimeReact 10** + Template **Sakai** (tema `lara-light-indigo`)
- **PrimeFlex 3** para layout/grid
- **PrimeIcons 7**
- **Axios** — instância centralizada em `app/api/index.ts` com Bearer token
- **cookies-next** — JWT armazenado no cookie `cdmshr_userjwt`
- **next-intl** — i18n (PT principal, EN futuro)
- **Chart.js 4** — dashboards
- **@react-pdf/renderer** — geração de PDF do formulário de avaliação
- **ExcelJS** — exportação de dados
- **SASS** — estilos
- Porta dev: **3200** (para não conflitar com CDMS Supplier na 3100)

### Backend

- **Laravel 11** (PHP 8.2+)
- **Laravel Sanctum** — autenticação API por token
- **Spatie Laravel Permission** — RBAC (papéis e permissões)
- **LDAPRecord-Laravel 3** — integração Active Directory
- **SQL Server** — base de dados `cdms_hr` (produção)
- **SQLite** — desenvolvimento local
- **Spatie Activity Log** — registo de auditoria
- **Laravel Notifications** — email + in-app
- **Maatwebsite Excel** — importação Position Batch
- **L5-Swagger** — documentação API

## Estrutura do Projecto

```
cdms-hr/
├── backend/                    # Laravel 11 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── CicloAvaliacaoController.php
│   │   │   │   ├── AvaliacaoController.php
│   │   │   │   ├── ItemAvaliacaoController.php
│   │   │   │   ├── IndicadorController.php
│   │   │   │   ├── MatrizPesosController.php
│   │   │   │   ├── TrabalhadorController.php
│   │   │   │   ├── DashboardController.php
│   │   │   │   ├── ContestacaoController.php
│   │   │   │   ├── OneOnOneController.php
│   │   │   │   ├── PlanoMelhoriaController.php
│   │   │   │   ├── RelatorioController.php
│   │   │   │   ├── UserController.php
│   │   │   │   ├── RolesController.php
│   │   │   │   └── PermissionController.php
│   │   │   ├── Middleware/
│   │   │   │   ├── CheckIfUserIsActive.php
│   │   │   │   ├── CheckPasswordExpiry.php
│   │   │   │   └── SecurityAuditLog.php
│   │   │   └── Requests/            # Form Requests para validação
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── CicloAvaliacao.php
│   │   │   ├── Trabalhador.php
│   │   │   ├── Indicador.php
│   │   │   ├── MatrizPesos.php
│   │   │   ├── Avaliacao.php
│   │   │   ├── ItemAvaliacao.php
│   │   │   ├── RegistoOneOnOne.php
│   │   │   ├── PlanoMelhoria.php
│   │   │   ├── Contestacao.php
│   │   │   └── RegistoAuditoria.php
│   │   ├── Notifications/
│   │   ├── Services/
│   │   │   ├── AvaliacaoService.php    # Lógica de cálculo de pontuação
│   │   │   └── WorkflowService.php     # Máquina de estados
│   │   └── Imports/
│   │       └── PositionBatchImport.php
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   │   └── api.php
│   └── config/
├── frontend/                   # Next.js 14 App Router
│   ├── app/
│   │   ├── (full-page)/        # Auth pages (sem sidebar)
│   │   │   ├── auth/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   └── access/page.tsx
│   │   ├── (main)/             # Páginas autenticadas (com sidebar)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── avaliacoes/
│   │   │   │   ├── nova/page.tsx
│   │   │   │   ├── historico/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── avaliador/
│   │   │   │   ├── pendentes/page.tsx
│   │   │   │   └── equipa/page.tsx
│   │   │   ├── departamento/
│   │   │   │   ├── aprovacoes/page.tsx
│   │   │   │   └── resumo/page.tsx
│   │   │   ├── rh/
│   │   │   │   ├── ciclos/page.tsx
│   │   │   │   ├── todas-avaliacoes/page.tsx
│   │   │   │   ├── relatorios/page.tsx
│   │   │   │   └── configuracao/page.tsx
│   │   │   ├── one-on-one/
│   │   │   │   └── page.tsx
│   │   │   └── admin/
│   │   │       ├── user-management/page.tsx
│   │   │       ├── roles/page.tsx
│   │   │       ├── permissions/page.tsx
│   │   │       ├── configuracoes/page.tsx
│   │   │       └── logs/page.tsx
│   │   ├── api/
│   │   │   └── index.ts         # Instância Axios centralizada
│   │   ├── components/
│   │   │   ├── RestrictedRoute.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── FormularioAvaliacao.tsx    # Componente principal do formulário
│   │   │   ├── PainelIndicador.tsx        # Painel por indicador
│   │   │   ├── ResumoCalculo.tsx          # Resumo automático de pontuação
│   │   │   └── PDFAvaliacao.tsx           # Template PDF para impressão
│   │   ├── context/
│   │   │   └── AppContext.tsx
│   │   ├── utils/
│   │   │   ├── auth.ts
│   │   │   ├── index.ts          # hasPermission(), helpers
│   │   │   └── calculos.ts       # Lógica de cálculo de pontuações
│   │   └── layout.tsx
│   ├── layout/
│   │   ├── layout.tsx            # Layout principal (Sakai)
│   │   ├── AppTopbar.tsx
│   │   ├── AppSidebar.tsx
│   │   ├── AppMenu.tsx           # Menu baseado em permissões
│   │   ├── AppFooter.tsx
│   │   └── context/
│   │       ├── layoutcontext.tsx
│   │       └── menucontext.tsx
│   ├── messages/
│   │   ├── pt.json               # Traduções PT (principal)
│   │   └── en.json               # Traduções EN (futuro)
│   ├── public/
│   │   └── themes/
│   │       └── lara-light-indigo/
│   └── types/
│       ├── index.d.ts
│       └── app.d.ts
└── docs/                        # Documentação do projecto
    ├── CLAUDE.md                # ESTE FICHEIRO
    ├── PRD.md
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── API.md
    └── TASKS.md
```

## Padrões de Código (seguir o CDMS Supplier)

### API Centralizada (Frontend)

```typescript
// app/api/index.ts
import axios from 'axios';
import { getCookie, hasCookie } from 'cookies-next';

export const API_HOST = process.env.NEXT_PUBLIC_API_HOST;
export const API = API_HOST + '/api';

let token = hasCookie('cdmshr_userjwt')
  ? JSON.parse(getCookie('cdmshr_userjwt')!).token
  : '';

export const api = axios.create({
  baseURL: API,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### Protecção de Rotas (Frontend)

```typescript
// Usar RestrictedRoute com permissões
<RestrictedRoute requiredPermissions={['criar autoavaliacao']}>
  <NovaAvaliacaoPage />
</RestrictedRoute>
```

### Menu Baseado em Permissões (Frontend)

```typescript
// Cada item do menu tem um array 'permissions'
{
  label: 'As Minhas Avaliações',
  icon: 'pi pi-fw pi-file-edit',
  permissions: ['acesso modulo-avaliacao'],
  items: [
    { label: 'Nova Autoavaliação', to: '/avaliacoes/nova', permissions: ['criar autoavaliacao'] },
    { label: 'O Meu Histórico', to: '/avaliacoes/historico', permissions: ['ver avaliacoes proprias'] }
  ]
}
```

### Rotas API (Backend)

```php
// Seguir o padrão do CDMS Supplier
Route::middleware(['auth:sanctum', CheckIfUserIsActive::class, CheckPasswordExpiry::class, 'throttle.api:1000,1'])->group(function () {
    Route::resource('ciclos', CicloAvaliacaoController::class)
        ->middleware('permission:acesso modulo-rh|gerir ciclos');
    Route::resource('avaliacoes', AvaliacaoController::class)
        ->middleware('permission:criar autoavaliacao|ver avaliacoes proprias');
});
```

### Convenção de Nomes

- **Modelos Laravel:** PascalCase em Português — `CicloAvaliacao`, `Avaliacao`, `Trabalhador`
- **Tabelas SQL Server:** snake_case em Português — `ciclos_avaliacao`, `avaliacoes`, `trabalhadores`
- **Controllers:** PascalCase + Controller — `AvaliacaoController`
- **Rotas API:** kebab-case — `/api/ciclos-avaliacao`, `/api/avaliacoes`
- **Páginas Next.js:** kebab-case em Português — `/avaliacoes/nova`, `/rh/ciclos`
- **Componentes React:** PascalCase — `FormularioAvaliacao.tsx`
- **Permissões:** kebab-case em Português — `criar autoavaliacao`, `acesso modulo-rh`

## Estados da Avaliação (Máquina de Estados)

```
RASCUNHO → AUTO_SUBMETIDA → AVAL_RASCUNHO → AVAL_SUBMETIDA → REV_DEPART → REV_RH → APROVADA → FEEDBACK_FEITO
                                                                                         ↓
                                                                                   CONTESTADA → [Revisão]
```

## Variáveis de Ambiente

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_HOST=http://localhost:8000
NEXT_PUBLIC_STORAGE_HOST=http://localhost:8000/storage
NEXT_PUBLIC_BASE_PATH=
```

### Backend (.env)

```env
APP_NAME="CDMS-HR"
DB_CONNECTION=sqlsrv
DB_HOST=127.0.0.1
DB_PORT=1433
DB_DATABASE=cdms_hr
DB_USERNAME=
DB_PASSWORD=

LDAP_HOST=
LDAP_USERNAME=
LDAP_PASSWORD=
LDAP_BASE_DN=
```

## Referência

Consultar os outros documentos nesta pasta para detalhes:
- `PRD.md` — Requisitos funcionais detalhados
- `ARCHITECTURE.md` — Arquitectura e padrões técnicos
- `DATABASE.md` — Esquema completo da base de dados
- `API.md` — Especificação de todos os endpoints
- `TASKS.md` — Tarefas de desenvolvimento por fase
