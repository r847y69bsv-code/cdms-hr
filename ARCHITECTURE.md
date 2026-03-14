# Arquitectura — CDMS-HR

## 1. Visão da Arquitectura

O CDMS-HR segue uma arquitectura monolítica desacoplada com dois projectos separados:

```
┌──────────────────────────────────────────────────────────┐
│                     Utilizador (Browser)                  │
└──────────────┬───────────────────────────┬───────────────┘
               │                           │
┌──────────────▼───────────────┐ ┌─────────▼───────────────┐
│    Frontend (Next.js 14)     │ │   Backend (Laravel 11)   │
│    Porta: 3200               │ │   Porta: 8000            │
│                              │ │                          │
│  ┌────────────────────────┐  │ │  ┌──────────────────┐   │
│  │  App Router            │  │ │  │  API REST (/api)  │   │
│  │  ├── (full-page)       │  │ │  │  ├── Sanctum Auth │   │
│  │  │   └── auth/login    │  │ │  │  ├── Controllers  │   │
│  │  └── (main)            │  │ │  │  ├── Services     │   │
│  │      ├── dashboard     │──┼─┼──│  ├── Models       │   │
│  │      ├── avaliacoes    │  │ │  │  └── Middleware    │   │
│  │      ├── avaliador     │  │ │  └──────────┬───────┘   │
│  │      ├── departamento  │  │ │             │           │
│  │      ├── rh            │  │ │  ┌──────────▼───────┐   │
│  │      └── admin         │  │ │  │   SQL Server      │   │
│  └────────────────────────┘  │ │  │   cdms_hr         │   │
│                              │ │  └──────────────────┘   │
│  PrimeReact + Sakai          │ │                          │
│  Axios → Bearer Token        │ │  LDAP / Active Directory │
└──────────────────────────────┘ └──────────────────────────┘
```

## 2. Frontend — Padrões Detalhados

### 2.1 Grupos de Rotas (Next.js App Router)

O Next.js 14 App Router usa route groups para separar layouts:

**`(full-page)`** — Páginas sem sidebar (login, recuperação de senha, acesso negado)
```
app/(full-page)/auth/login/page.tsx
app/(full-page)/auth/forgot-password/page.tsx
app/(full-page)/auth/access/page.tsx
```

**`(main)`** — Páginas autenticadas com layout completo (sidebar + topbar + footer)
```
app/(main)/layout.tsx          ← importa o Layout principal
app/(main)/dashboard/page.tsx
app/(main)/avaliacoes/nova/page.tsx
...
```

### 2.2 Layout Sakai (PrimeReact)

O layout segue o template Sakai exactamente como no CDMS Supplier:

```
┌─────────────────────────────────────────────────────────┐
│ AppTopbar                                               │
│ [Logo] [Título] ... [Língua PT|EN] [Notificações] [User]│
├─────────────┬───────────────────────────────────────────┤
│ AppSidebar  │ layout-main-container                     │
│             │                                           │
│ AppMenu     │   ┌─────────────────────────────────┐     │
│ (permissões)│   │     Conteúdo da Página           │     │
│             │   │     {children}                    │     │
│ ┌─────────┐ │   └─────────────────────────────────┘     │
│ │ Avatar  │ │                                           │
│ │ [Nome]  │ │                                           │
│ └─────────┘ │ AppFooter                                 │
└─────────────┴───────────────────────────────────────────┘
```

Configuração do layout (layoutcontext.tsx):
```typescript
const defaultConfig = {
  ripple: false,
  inputStyle: 'outlined',
  menuMode: 'static',       // 'static' ou 'overlay'
  colorScheme: 'light',
  theme: 'lara-light-indigo',
  scale: 13,
};
```

### 2.3 Sistema de Autenticação (Frontend)

```typescript
// Fluxo de Login:
// 1. POST /api/v1/ldaplogin (credenciais LDAP)
// 2. Backend valida no AD, cria token Sanctum, retorna user + token
// 3. Frontend guarda no cookie: cdmshr_userjwt = { user, token }
// 4. Axios intercepta e adiciona Bearer token a cada request

// Verificação de autenticação:
import { isAuthenticated } from '@/app/utils/auth';
const { user, token } = isAuthenticated();

// Verificação de permissão:
import { hasPermission } from '@/app/utils';
if (hasPermission(user, ['criar autoavaliacao'])) { ... }
```

### 2.4 Menu Baseado em Permissões

O AppMenu.tsx filtra recursivamente os itens do menu:

```typescript
const filterMenuItems = (items: AppMenuItem[]): AppMenuItem[] => {
  return items.filter((item) => {
    if (item.permissions && !hasPermission(user, item.permissions)) {
      return false;
    }
    if (item.items) {
      item.items = filterMenuItems(item.items);
      return item.items.length > 0;
    }
    return true;
  });
};
```

### 2.5 Instância API Centralizada

```typescript
// app/api/index.ts
// TODAS as chamadas API passam por esta instância
import axios from 'axios';
import { getCookie, hasCookie } from 'cookies-next';

export const API_HOST = process.env.NEXT_PUBLIC_API_HOST;
export const API = API_HOST + '/api';

let token = hasCookie('cdmshr_userjwt')
  ? JSON.parse(getCookie('cdmshr_userjwt')!).token
  : '';

export const api = axios.create({
  baseURL: API,
  headers: { Authorization: `Bearer ${token}` },
});

// Uso nos componentes:
// import { api } from '@/app/api';
// const { data } = await api.get('/avaliacoes');
// await api.post('/avaliacoes', payload);
```

### 2.6 Componentes PrimeReact Chave

Componentes do PrimeReact 10 a usar:

| Componente | Uso no CDMS-HR |
|------------|----------------|
| `DataTable` | Listagem de avaliações, trabalhadores, ciclos (com lazy loading) |
| `Dialog` | Confirmações, detalhes, rejeição com comentário |
| `Dropdown` | Selecção de classificação nos indicadores |
| `InputTextarea` | Comentários por indicador |
| `Tag` | Badges de estado (RASCUNHO, APROVADA, etc.) |
| `Steps` | Indicador visual do progresso do workflow |
| `Chart` | Gráficos do dashboard (bar, pie, doughnut) |
| `Toast` | Mensagens de sucesso/erro |
| `OverlayPanel` | Notificações (como no CDMS Supplier) |
| `Avatar` | Foto/inicial do utilizador no sidebar |
| `SelectButton` | Selector de língua PT/EN |
| `TabView` | Separar secções no formulário de avaliação |
| `Card` | Cards do dashboard com métricas |
| `ProgressBar` | Percentagem de conclusão |
| `Badge` | Contagem de notificações não lidas |
| `Timeline` | Histórico de estados da avaliação |
| `Toolbar` | Barra de acções nas listagens |
| `FileUpload` | Upload do Position Batch |

## 3. Backend — Padrões Detalhados

### 3.1 Estrutura de Controllers

Seguir o padrão Resource Controller do Laravel:

```php
// CicloAvaliacaoController.php
class CicloAvaliacaoController extends Controller
{
    public function index()      // GET    /api/ciclos-avaliacao
    public function store()      // POST   /api/ciclos-avaliacao
    public function show($id)    // GET    /api/ciclos-avaliacao/{id}
    public function update($id)  // PUT    /api/ciclos-avaliacao/{id}
    public function destroy($id) // DELETE /api/ciclos-avaliacao/{id}
}
```

Controllers adicionais para acções específicas do workflow:

```php
// AvaliacaoController.php — além do CRUD standard:
Route::put('/avaliacoes/{id}/submeter-auto', [AvaliacaoController::class, 'submeterAutoavaliacao']);
Route::put('/avaliacoes/{id}/submeter-avaliador', [AvaliacaoController::class, 'submeterAvaliador']);
Route::put('/avaliacoes/{id}/aprovar-departamento', [AvaliacaoController::class, 'aprovarDepartamento']);
Route::put('/avaliacoes/{id}/devolver-departamento', [AvaliacaoController::class, 'devolverDepartamento']);
Route::put('/avaliacoes/{id}/aprovar-rh', [AvaliacaoController::class, 'aprovarRH']);
Route::put('/avaliacoes/{id}/devolver-rh', [AvaliacaoController::class, 'devolverRH']);
Route::put('/avaliacoes/{id}/contestar', [AvaliacaoController::class, 'contestar']);
Route::put('/avaliacoes/{id}/registar-feedback', [AvaliacaoController::class, 'registarFeedback']);
```

### 3.2 Service Layer

Lógica de negócio complexa em Services (não nos Controllers):

```php
// AvaliacaoService.php
class AvaliacaoService
{
    public function calcularPontuacao(Avaliacao $avaliacao): float
    {
        // 1. Obter MatrizPesos para a categoria funcional do trabalhador
        // 2. Para cada ItemAvaliacao, aplicar peso × multiplicador
        // 3. Somar pontuações
        // 4. Determinar classificação final
    }

    public function transitarEstado(Avaliacao $avaliacao, string $novoEstado, int $userId, ?string $comentarios = null): void
    {
        // 1. Validar transição permitida
        // 2. Actualizar estado
        // 3. Registar na auditoria
        // 4. Enviar notificação
    }
}
```

### 3.3 Middleware Stack

Aplicar a mesma stack de middleware do CDMS Supplier:

```php
Route::middleware([
    'auth:sanctum',              // Autenticação Sanctum
    CheckIfUserIsActive::class,  // Verificar se o user está activo
    CheckPasswordExpiry::class,  // Verificar expiração de senha
    'throttle.api:1000,1',       // Rate limiting
])->group(function () {
    // Rotas protegidas aqui
});
```

### 3.4 Spatie Permission — Papéis e Permissões

```php
// Papéis:
// - trabalhador
// - avaliador
// - chefe-departamento
// - gestor-rh
// - admin

// Permissões (exemplos):
// Módulo Avaliação
'criar autoavaliacao'
'ver avaliacoes proprias'
'submeter autoavaliacao'
'acesso painel-avaliador'
'preencher avaliacao'
'submeter avaliacao-avaliador'
'acesso revisao-departamental'
'aprovar avaliacao-departamento'
'devolver avaliacao-departamento'
'acesso modulo-rh'
'aprovar avaliacao-rh'
'devolver avaliacao-rh'
'contestar avaliacao'

// Módulo Configuração
'gerir ciclos'
'gerir indicadores'
'gerir pesos'
'importar position-batch'

// Dashboard
'acesso dashboard'
'acesso dashboard-rh'
'acesso dashboard-departamento'

// Relatórios
'exportar excel'
'gerar pdf'
'ver relatorios'

// One-on-One
'acesso one-on-one'
'registar one-on-one'

// Administração
'gerir utilizadores'
'gerir papeis'
'gerir permissoes'
'ver logs'
```

### 3.5 Notificações Laravel

```php
// Notificação enviada em cada transição de estado
class AvaliacaoSubmetidaNotification extends Notification
{
    use Queueable;

    public function via($notifiable): array
    {
        return ['mail', 'database']; // email + in-app
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Nova Avaliação para Revisão')
            ->line("O trabalhador {$this->avaliacao->trabalhador->nome} submeteu a sua autoavaliação.")
            ->action('Ver Avaliação', url("/avaliador/pendentes"));
    }

    public function toArray($notifiable): array
    {
        return [
            'avaliacao_id' => $this->avaliacao->id,
            'mensagem' => "Nova autoavaliação de {$this->avaliacao->trabalhador->nome}",
            'tipo' => 'avaliacao_submetida',
        ];
    }
}
```

### 3.6 Activity Log (Auditoria)

```php
// Em cada Model que precisa de auditoria
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Avaliacao extends Model
{
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn(string $eventName) => "Avaliação {$eventName}");
    }
}
```

## 4. Integração LDAP

Mesmo padrão do CDMS Supplier com LDAPRecord-Laravel 3:

```php
// config/ldap.php — configuração do servidor AD
// Fluxo de autenticação:
// 1. Receber credenciais do frontend
// 2. Validar contra o Active Directory
// 3. Se válido, criar/atualizar User local
// 4. Gerar token Sanctum
// 5. Retornar user + token ao frontend

// Fallback: se LDAP indisponível, permitir login com credenciais locais (mesmo comportamento do CDMS)
```

## 5. Segurança

Implementar exactamente as mesmas medidas do CDMS Supplier:

- **CheckIfUserIsActive** — rejeitar users desactivados
- **CheckPasswordExpiry** — forçar mudança de senha expirada
- **Rate Limiting** — `throttle.api`, `throttle.login`, `throttle.password`
- **Security Audit Log** — registar tentativas de login
- **CORS** — configurar para aceitar apenas domínios permitidos
- **RBAC** — Spatie Permission em cada rota
- **Isolamento de dados** — filtrar sempre por user/departamento nos controllers

## 6. Geração de PDF (Frontend)

Usar @react-pdf/renderer para gerar o formulário de avaliação:

```typescript
// components/PDFAvaliacao.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const FormularioAvaliacaoPDF = ({ avaliacao, trabalhador, itens }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Cabeçalho Cornelder */}
      {/* Dados do Trabalhador */}
      {/* Tabela de Indicadores (duas colunas: auto + avaliador) */}
      {/* Pontuação Final */}
      {/* Ética */}
      {/* Aspectos a Melhorar */}
      {/* Linhas de Assinatura (4 campos) */}
    </Page>
  </Document>
);
```

## 7. Internacionalização

Usar next-intl com ficheiros JSON em `messages/`:

```json
// messages/pt.json
{
  "appMenu": {
    "dashboard": "Painel Principal",
    "minhasAvaliacoes": "As Minhas Avaliações",
    "novaAutoavaliacao": "Nova Autoavaliação",
    "meuHistorico": "O Meu Histórico",
    "painelAvaliador": "Painel do Avaliador",
    ...
  },
  "avaliacao": {
    "lideranca": "Liderança",
    "cumprimentoTarefas": "Cumprimento de Tarefas",
    "qualidadeTrabalho": "Qualidade do Trabalho",
    ...
  }
}
```
