# API Endpoints — CDMS-HR

## Base URL

```
Desenvolvimento: http://localhost:8000/api
Produção: https://<server>/cdms-hr-api/api
```

## Autenticação

Todas as rotas protegidas requerem o header:
```
Authorization: Bearer {token}
```

O token é obtido via login e armazenado no cookie `cdmshr_userjwt`.

## Middleware Padrão (Rotas Protegidas)

```
auth:sanctum, CheckIfUserIsActive, CheckPasswordExpiry, throttle.api:1000,1
```

---

## 1. Autenticação

| Método | Endpoint | Descrição | Middleware |
|--------|----------|-----------|-----------|
| POST | `/v1/ldaplogin` | Login via LDAP/Active Directory | throttle.login, security.audit |
| POST | `/login` | Login local (fallback) | throttle.login, security.audit |
| POST | `/logout` | Terminar sessão | auth:sanctum |
| POST | `/updatepassword` | Alterar senha | auth:sanctum |
| POST | `/forgot-password` | Enviar link de reset | throttle.password |
| POST | `/reset-password` | Efectuar reset de senha | throttle.password |

### POST /v1/ldaplogin

**Request:**
```json
{
  "username": "ivan.goncalves",
  "password": "***"
}
```

**Response 200:**
```json
{
  "user": {
    "id": 1,
    "name": "Ivan Gonçalves",
    "email": "ivan.goncalves@cornelder.com",
    "roles": ["admin", "gestor-rh"],
    "permissions": ["acesso dashboard", "acesso modulo-rh", "..."]
  },
  "token": "1|abc123def456..."
}
```

---

## 2. Ciclos de Avaliação

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/ciclos-avaliacao` | Listar todos os ciclos | acesso modulo-rh |
| POST | `/ciclos-avaliacao` | Criar novo ciclo | gerir ciclos |
| GET | `/ciclos-avaliacao/{id}` | Ver detalhe do ciclo | acesso modulo-rh |
| PUT | `/ciclos-avaliacao/{id}` | Actualizar ciclo | gerir ciclos |
| DELETE | `/ciclos-avaliacao/{id}` | Eliminar ciclo (soft delete) | gerir ciclos |
| GET | `/ciclos-avaliacao/activo` | Obter ciclo activo actual | auth:sanctum |
| PUT | `/ciclos-avaliacao/{id}/activar` | Activar ciclo | gerir ciclos |
| PUT | `/ciclos-avaliacao/{id}/fechar` | Fechar ciclo | gerir ciclos |

### POST /ciclos-avaliacao

**Request:**
```json
{
  "nome": "Avaliação Anual 2025",
  "ano": 2025,
  "data_inicio": "2025-01-01",
  "data_fim": "2025-12-31",
  "prazo_autoavaliacao": "2026-01-31",
  "prazo_avaliador": "2026-02-28"
}
```

---

## 3. Indicadores

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/indicadores` | Listar indicadores | auth:sanctum |
| POST | `/indicadores` | Criar indicador | gerir indicadores |
| PUT | `/indicadores/{id}` | Actualizar indicador | gerir indicadores |
| DELETE | `/indicadores/{id}` | Desactivar indicador | gerir indicadores |

---

## 4. Matriz de Pesos

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/matriz-pesos?ciclo_id={id}` | Listar pesos por ciclo | acesso modulo-rh |
| GET | `/matriz-pesos/categoria/{categoria}?ciclo_id={id}` | Pesos por categoria funcional | auth:sanctum |
| POST | `/matriz-pesos` | Criar/actualizar pesos em batch | gerir pesos |
| POST | `/matriz-pesos/copiar/{ciclo_origem}/{ciclo_destino}` | Copiar pesos entre ciclos | gerir pesos |

### POST /matriz-pesos (batch)

**Request:**
```json
{
  "ciclo_id": 1,
  "pesos": [
    { "categoria_funcional": "Não Líder", "indicador_id": 2, "peso": 30.00 },
    { "categoria_funcional": "Não Líder", "indicador_id": 3, "peso": 30.00 },
    { "categoria_funcional": "Não Líder", "indicador_id": 4, "peso": 20.00 },
    { "categoria_funcional": "Não Líder", "indicador_id": 5, "peso": 20.00 },
    { "categoria_funcional": "Capataz", "indicador_id": 1, "peso": 15.00 },
    { "categoria_funcional": "Capataz", "indicador_id": 2, "peso": 30.00 }
  ]
}
```

---

## 5. Trabalhadores

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/trabalhadores` | Listar trabalhadores (paginado) | acesso modulo-rh \| gerir utilizadores |
| GET | `/trabalhadores/{id}` | Ver detalhe | auth:sanctum |
| GET | `/trabalhadores/meu-perfil` | Dados do trabalhador logado | auth:sanctum |
| GET | `/trabalhadores/subordinados` | Listar subordinados do avaliador logado | acesso painel-avaliador |
| GET | `/trabalhadores/departamento/{dept}` | Listar por departamento | acesso revisao-departamental |
| POST | `/trabalhadores/importar` | Importar Position Batch (Excel) | importar position-batch |

### POST /trabalhadores/importar

**Request:** multipart/form-data
```
file: Position_Batch.xlsx
```

**Response 200:**
```json
{
  "total_processados": 1762,
  "criados": 45,
  "actualizados": 1710,
  "erros": 7,
  "detalhes_erros": [
    { "linha": 234, "codigo": "EMP234", "erro": "Departamento em falta" }
  ]
}
```

---

## 6. Avaliações (Módulo Principal)

### CRUD e Listagem

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/avaliacoes` | Listar avaliações (filtros: ciclo, estado, dept) | auth:sanctum (filtrado por papel) |
| POST | `/avaliacoes` | Criar nova autoavaliação | criar autoavaliacao |
| GET | `/avaliacoes/{id}` | Ver detalhe completo | auth:sanctum (com verificação de acesso) |
| PUT | `/avaliacoes/{id}` | Actualizar rascunho (auto ou avaliador) | auth:sanctum |
| GET | `/avaliacoes/minhas` | Minhas avaliações (trabalhador logado) | ver avaliacoes proprias |
| GET | `/avaliacoes/pendentes-avaliador` | Avaliações pendentes (avaliador logado) | acesso painel-avaliador |
| GET | `/avaliacoes/departamento` | Avaliações do departamento | acesso revisao-departamental |
| GET | `/avaliacoes/todas` | Todas (para RH) | acesso modulo-rh |

### Acções de Workflow

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| PUT | `/avaliacoes/{id}/submeter-auto` | Submeter autoavaliação | submeter autoavaliacao |
| PUT | `/avaliacoes/{id}/submeter-avaliador` | Avaliador submete ao dept. | submeter avaliacao-avaliador |
| PUT | `/avaliacoes/{id}/aprovar-departamento` | Chefe dept. aprova | aprovar avaliacao-departamento |
| PUT | `/avaliacoes/{id}/devolver-departamento` | Chefe dept. devolve | devolver avaliacao-departamento |
| PUT | `/avaliacoes/{id}/aprovar-rh` | RH aprova (finaliza) | aprovar avaliacao-rh |
| PUT | `/avaliacoes/{id}/devolver-rh` | RH devolve | devolver avaliacao-rh |
| PUT | `/avaliacoes/{id}/registar-feedback` | Registar reunião de feedback | acesso painel-avaliador |

### POST /avaliacoes (Criar autoavaliação)

**Request:**
```json
{
  "ciclo_id": 1,
  "itens": [
    {
      "indicador_id": 2,
      "classificacao_auto": "ATENDE",
      "comentario_auto": "Cumpri todas as tarefas dentro dos prazos estabelecidos."
    },
    {
      "indicador_id": 3,
      "classificacao_auto": "EXCEDE",
      "comentario_auto": "Trabalho consistentemente sem erros."
    }
  ],
  "etica_violacao": false,
  "areas_melhoria": "Melhorar a gestão do tempo em projectos complexos."
}
```

**Response 201:**
```json
{
  "id": 42,
  "ciclo_id": 1,
  "trabalhador_id": 15,
  "estado": "RASCUNHO",
  "itens": [...],
  "pontuacao_final_auto": null,
  "created_at": "2026-03-10T10:00:00Z"
}
```

### PUT /avaliacoes/{id}/submeter-auto

**Request:**
```json
{}
```

**Response 200:**
```json
{
  "id": 42,
  "estado": "AUTO_SUBMETIDA",
  "data_autoavaliacao": "2026-03-10T10:30:00Z",
  "pontuacao_final_auto": 87.50,
  "mensagem": "Autoavaliação submetida com sucesso. O seu avaliador foi notificado."
}
```

### PUT /avaliacoes/{id}/submeter-avaliador

**Request:**
```json
{
  "itens": [
    {
      "indicador_id": 2,
      "classificacao_avaliador": "ATENDE",
      "comentario_avaliador": "Bom desempenho geral no cumprimento de tarefas."
    }
  ],
  "comentarios_avaliador_geral": "Trabalhador dedicado com potencial de crescimento."
}
```

### PUT /avaliacoes/{id}/devolver-departamento

**Request:**
```json
{
  "comentarios_devolucao": "Favor rever classificação do indicador de Qualidade."
}
```

---

## 7. Contestações

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| POST | `/contestacoes` | Submeter contestação | contestar avaliacao |
| GET | `/contestacoes/{id}` | Ver detalhe | auth:sanctum |
| PUT | `/contestacoes/{id}/responder` | Responder à contestação | acesso revisao-departamental \| acesso modulo-rh |

### POST /contestacoes

**Request:**
```json
{
  "avaliacao_id": 42,
  "texto_justificacao": "Discordo da classificação no indicador de Cumprimento de Tarefas porque..."
}
```

---

## 8. Reuniões One-on-One

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/one-on-one?avaliacao_id={id}` | Listar registos da avaliação | acesso one-on-one |
| POST | `/one-on-one` | Registar nova reunião | registar one-on-one |
| PUT | `/one-on-one/{id}` | Actualizar registo | registar one-on-one |

### POST /one-on-one

**Request:**
```json
{
  "avaliacao_id": 42,
  "trimestre": "T1",
  "data_reuniao": "2025-04-15",
  "pontos_discussao": "Progresso nas tarefas, feedback sobre qualidade, plano de desenvolvimento.",
  "accoes_definidas": "1. Concluir formação em gestão de projecto. 2. Melhorar relatórios semanais."
}
```

---

## 9. Planos de Melhoria (PMI)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/planos-melhoria?avaliacao_id={id}` | Listar planos | auth:sanctum |
| POST | `/planos-melhoria` | Criar plano | acesso painel-avaliador \| acesso modulo-rh |
| PUT | `/planos-melhoria/{id}` | Actualizar plano | acesso painel-avaliador \| acesso modulo-rh |

---

## 10. Dashboard

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/dashboard` | Dashboard geral (adaptado ao papel) | acesso dashboard |
| GET | `/dashboard/rh` | Dashboard global RH | acesso dashboard-rh |
| GET | `/dashboard/departamento` | Dashboard departamental | acesso dashboard-departamento |
| GET | `/dashboard/avaliador` | Dashboard do avaliador | acesso painel-avaliador |

### GET /dashboard/rh

**Response 200:**
```json
{
  "ciclo_activo": { "id": 1, "nome": "Avaliação Anual 2025", "ano": 2025 },
  "resumo_global": {
    "total_trabalhadores": 1762,
    "total_avaliacoes": 1450,
    "percentagem_conclusao": 82.3,
    "pontuacao_media": 78.5
  },
  "por_estado": {
    "RASCUNHO": 120,
    "AUTO_SUBMETIDA": 85,
    "AVAL_RASCUNHO": 45,
    "AVAL_SUBMETIDA": 60,
    "REV_DEPART": 30,
    "REV_RH": 20,
    "APROVADA": 1050,
    "FEEDBACK_FEITO": 40
  },
  "por_departamento": [
    { "departamento": "Operações", "total": 450, "concluidas": 380, "pendentes": 70 },
    { "departamento": "Manutenção", "total": 200, "concluidas": 170, "pendentes": 30 },
    { "departamento": "Administração", "total": 80, "concluidas": 75, "pendentes": 5 }
  ],
  "violacoes_eticas": 3,
  "pontuacao_media_departamento": [
    { "departamento": "Operações", "media": 76.2 },
    { "departamento": "Manutenção", "media": 81.5 }
  ]
}
```

---

## 11. Relatórios e Exportação

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/relatorios/exportar-excel?ciclo_id={id}&departamento={dept}` | Exportar Excel | exportar excel |
| GET | `/relatorios/pdf/{avaliacao_id}` | Dados para gerar PDF (frontend gera) | gerar pdf |
| GET | `/relatorios/resumo?ciclo_id={id}` | Resumo estatístico | ver relatorios |

---

## 12. Notificações

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/notificacoes` | Listar notificações | auth:sanctum |
| GET | `/notificacoes/nao-lidas` | Apenas não lidas | auth:sanctum |
| POST | `/notificacoes/{id}/marcar-lida` | Marcar como lida | auth:sanctum |
| POST | `/notificacoes/marcar-todas-lidas` | Marcar todas como lidas | auth:sanctum |
| GET | `/notificacoes/contar-nao-lidas` | Contagem para badge | auth:sanctum |

---

## 13. Administração

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| Resource | `/users` | CRUD de utilizadores | gerir utilizadores |
| Resource | `/roles` | CRUD de papéis | gerir papeis |
| Resource | `/permissions` | CRUD de permissões | gerir permissoes |
| POST | `/roles/{id}/rolepermission` | Atribuir permissões ao papel | gerir papeis |
| POST | `/users/{id}/roles` | Atribuir papel ao utilizador | gerir papeis |
| GET | `/logs` | Listar registos de auditoria | ver logs |

---

## Paginação

Todas as listagens suportam paginação server-side (para lazy loading do DataTable):

```
GET /avaliacoes?page=1&per_page=25&sort_by=created_at&sort_order=desc
```

**Query Parameters Comuns:**
- `page` — Número da página (default: 1)
- `per_page` — Itens por página (default: 25)
- `sort_by` — Campo de ordenação
- `sort_order` — `asc` ou `desc`
- `search` — Pesquisa textual
- `ciclo_id` — Filtrar por ciclo
- `estado` — Filtrar por estado
- `departamento` — Filtrar por departamento

**Response com Paginação:**
```json
{
  "data": [...],
  "current_page": 1,
  "per_page": 25,
  "total": 1450,
  "last_page": 58
}
```

---

## Códigos de Resposta HTTP

| Código | Significado |
|--------|-------------|
| 200 | Sucesso |
| 201 | Recurso criado |
| 400 | Dados inválidos |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Recurso não encontrado |
| 422 | Validação falhou (com detalhes dos erros) |
| 429 | Rate limit excedido |
| 500 | Erro interno |
