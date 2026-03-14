# CDMS-HR - Sistema de Avaliação de Desempenho

Sistema web de Avaliação de Desempenho para a Cornelder de Moçambique, desenvolvido para digitalizar o processo de avaliação anual definido na Ordem de Serviço N.º 13 de 2025.

## Tecnologias

### Backend
- **Laravel 11** (PHP 8.2+)
- **Laravel Sanctum** - Autenticação API
- **Spatie Laravel Permission** - RBAC
- **LDAPRecord-Laravel** - Integração Active Directory
- **SQL Server** / SQLite

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **PrimeReact 10** + Template Sakai
- **PrimeFlex 3**

## Requisitos

### Backend
- PHP 8.2+
- Composer 2.x
- SQL Server ou SQLite
- Extensões PHP: pdo, pdo_sqlsrv (ou pdo_sqlite), ldap, mbstring, openssl

### Frontend
- Node.js 18+
- npm 9+

## Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/r847y69bsv-code/cdms-hr.git
cd cdms-hr
```

### 2. Configurar o Backend

```bash
cd backend

# Instalar dependências
composer install

# Copiar ficheiro de configuração
cp .env.example .env

# Gerar chave da aplicação
php artisan key:generate
```

#### Configurar Base de Dados

Editar o ficheiro `.env`:

**Para SQL Server (Produção):**
```env
DB_CONNECTION=sqlsrv
DB_HOST=127.0.0.1
DB_PORT=1433
DB_DATABASE=cdms_hr
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
```

**Para SQLite (Desenvolvimento):**
```env
DB_CONNECTION=sqlite
DB_DATABASE=/caminho/absoluto/para/database/database.sqlite
```

#### Configurar LDAP (Opcional)

```env
LDAP_HOST=seu_servidor_ldap
LDAP_USERNAME=cn=admin,dc=empresa,dc=com
LDAP_PASSWORD=senha_ldap
LDAP_BASE_DN=dc=empresa,dc=com
```

#### Executar Migrações e Seeds

```bash
# Criar tabelas
php artisan migrate

# Popular com dados iniciais (roles, permissions, indicadores, etc.)
php artisan db:seed

# OU para dados de demonstração completos
php artisan db:seed --class=DemoDataSeeder
```

### 3. Configurar o Frontend

```bash
cd ../frontend

# Instalar dependências
npm install

# Copiar ficheiro de configuração
cp .env.example .env.local
```

Editar o ficheiro `.env.local`:

```env
NEXT_PUBLIC_API_HOST=http://localhost:8000
NEXT_PUBLIC_STORAGE_HOST=http://localhost:8000/storage
```

### 4. Iniciar os Serviços

#### Desenvolvimento

**Terminal 1 - Backend:**
```bash
cd backend
php artisan serve --port=8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Aceder a: http://localhost:3000

#### Produção

**Backend:**
```bash
cd backend
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## Utilizadores de Demonstração

Após executar os seeds, estarão disponíveis:

| Email | Senha | Papel |
|-------|-------|-------|
| admin@cornelder.co.mz | password | Administrador |
| rh@cornelder.co.mz | password | RH |
| supervisor@cornelder.co.mz | password | Avaliador |
| trabalhador@cornelder.co.mz | password | Trabalhador |

## Estrutura do Projecto

```
cdms-hr/
├── backend/                    # Laravel 11 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   └── Middleware/
│   │   ├── Models/
│   │   └── Services/
│   ├── config/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/
│       └── api.php
│
├── frontend/                   # Next.js 14
│   ├── app/
│   │   ├── (full-page)/       # Páginas sem sidebar (login)
│   │   ├── (main)/            # Páginas autenticadas
│   │   ├── api/               # Configuração Axios
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── context/           # Contextos React
│   │   └── utils/             # Utilitários
│   ├── layout/                # Layout Sakai
│   ├── public/
│   │   └── themes/            # Temas PrimeReact
│   ├── styles/
│   └── types/
│
├── API.md                      # Documentação da API
├── ARCHITECTURE.md             # Arquitectura técnica
├── DATABASE.md                 # Esquema da base de dados
├── PRD.md                      # Requisitos funcionais
└── TASKS.md                    # Tarefas de desenvolvimento
```

## Funcionalidades

### Módulo de Avaliações
- Autoavaliação com formulário dinâmico
- Avaliação por supervisor
- Fluxo de aprovação (Departamento → RH)
- Histórico de avaliações
- Geração de PDF
- Exportação Excel

### Painel do Avaliador
- Avaliações pendentes
- Gestão de equipa
- Planos de melhoria
- Registos One-on-One

### Módulo RH
- Gestão de ciclos de avaliação
- Visão de todas as avaliações
- Gestão de contestações
- Relatórios e estatísticas

### Administração
- Gestão de utilizadores
- Gestão de papéis e permissões
- Logs de auditoria

### Sistema de Notificações
- Notificações em tempo real
- Sino com badge no topbar
- Página de gestão de notificações

## Deploy em Produção

### Nginx (Backend)

```nginx
server {
    listen 80;
    server_name api.cdms-hr.cornelder.co.mz;
    root /var/www/cdms-hr/backend/public;

    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### Nginx (Frontend)

```nginx
server {
    listen 80;
    server_name cdms-hr.cornelder.co.mz;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 (Frontend)

```bash
cd frontend
npm run build
pm2 start npm --name "cdms-hr-frontend" -- start
pm2 save
```

### Supervisor (Backend Queue)

```ini
[program:cdms-hr-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/cdms-hr/backend/artisan queue:work
autostart=true
autorestart=true
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/cdms-hr/backend/storage/logs/worker.log
```

## Variáveis de Ambiente

### Backend (.env)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| APP_NAME | Nome da aplicação | CDMS-HR |
| APP_ENV | Ambiente | production |
| APP_DEBUG | Debug mode | false |
| APP_URL | URL da API | https://api.cdms-hr.cornelder.co.mz |
| DB_CONNECTION | Driver BD | sqlsrv |
| DB_HOST | Host BD | 127.0.0.1 |
| DB_DATABASE | Nome BD | cdms_hr |
| LDAP_HOST | Servidor LDAP | ldap.cornelder.co.mz |

### Frontend (.env.local)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| NEXT_PUBLIC_API_HOST | URL da API | https://api.cdms-hr.cornelder.co.mz |
| NEXT_PUBLIC_STORAGE_HOST | URL do storage | https://api.cdms-hr.cornelder.co.mz/storage |

## Comandos Úteis

### Backend

```bash
# Limpar cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Verificar rotas
php artisan route:list

# Executar testes
php artisan test

# Criar novo controller
php artisan make:controller Api/NomeController --api
```

### Frontend

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Lint
npm run lint

# Verificar tipos
npx tsc --noEmit
```

## Suporte

Para questões ou problemas, contactar:
- Email: suporte@cornelder.co.mz
- Documentação: Ver ficheiros .md na raiz do projecto

## Licença

Propriedade de Cornelder de Moçambique. Todos os direitos reservados.
