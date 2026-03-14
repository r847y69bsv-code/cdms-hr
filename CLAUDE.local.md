# Progresso do Desenvolvimento CDMS-HR

## Sessão: 2026-03-12

### Correções Implementadas

#### 1. Erro de Hidratação (Hydration Error)
- **Dashboard** (`frontend/app/(main)/dashboard/page.tsx`): Adicionado estado `loading` com `ProgressSpinner`
- **Menu Lateral** (`frontend/layout/AppMenu.tsx`): Adicionado estado `mounted` para renderização client-side

#### 2. Token Axios não atualizava após login
- **API** (`frontend/app/api/index.ts`): Adicionado interceptor de request para obter token fresco do cookie

#### 3. Logo quebrado (404)
- Criado `frontend/public/layout/images/logo.svg`
- Atualizado `AppTopbar.tsx` e `AppFooter.tsx` para usar `.svg`

#### 4. Permissões não encontradas
- Atualizado `hasPermission` em `frontend/app/utils/index.ts` para verificar `user.permission` e `user.permissions`
- Adicionado campo `permission?: string[]` em `frontend/types/app.d.ts`

#### 5. Páginas Frontend Criadas
- `/avaliador/avaliar/[id]/page.tsx` - Formulário de avaliação do avaliador
- `/one-on-one/page.tsx` - Registos de reuniões One-on-One
- `/rh/relatorios/page.tsx` - Relatórios com gráficos
- `/admin/roles/page.tsx` - Gestão de papéis
- `/admin/logs/page.tsx` - Visualizador de logs de auditoria
- `/departamento/aprovacoes/page.tsx` - Aprovações departamentais
- `/departamento/resumo/page.tsx` - Estatísticas do departamento
- `/user/profile/page.tsx` - Página de perfil do utilizador

### Backend
- Laravel 11 configurado com **SQL Server**
- Base de dados `cdms_hr` criada com 27 tabelas
- Dados iniciais inseridos (users, roles, permissions, indicadores, matriz_pesos, trabalhadores)
- Servidor a correr em `http://localhost:8000`
- **SQL Server**: Docker container `sqlserver` na porta 1433
  - User: `sa`
  - Password: `StrongP@ss123`

### Frontend
- Next.js 14 a correr em `http://localhost:3200`
- Todas as páginas compilam sem erros

### Utilizadores de Teste
| Email | Password | Role |
|-------|----------|------|
| admin@cornelder.co.mz | password | admin |
| rh@cornelder.co.mz | password | recursos_humanos |
| avaliador@cornelder.co.mz | password | avaliador |
| trabalhador@cornelder.co.mz | password | trabalhador |

### Próximos Passos
- [ ] Integrar API real nos componentes frontend
- [ ] Implementar lógica de cálculo de pontuações
- [ ] Adicionar validações nos formulários
- [ ] Implementar notificações
- [ ] Testes end-to-end
