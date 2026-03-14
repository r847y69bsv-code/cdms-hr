# Base de Dados — CDMS-HR

## Informações de Conexão

- **Motor:** SQL Server (sqlsrv)
- **Base de dados:** `cdms_hr`
- **Desenvolvimento local:** SQLite
- **Servidor:** Mesmo servidor do CDMS Supplier

## Diagrama ER (Entidades e Relações)

```
┌──────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│     users        │     │  trabalhadores   │     │ ciclos_avaliacao  │
│──────────────────│     │──────────────────│     │───────────────────│
│ id               │◄───┐│ id               │     │ id                │
│ name             │    ││ user_id (FK)     │────►│ nome              │
│ email            │    ││ codigo_trabalhador│     │ ano               │
│ password         │    ││ nome             │     │ data_inicio       │
│ ldap_guid        │    ││ codigo_posicao   │     │ data_fim          │
│ is_active        │    ││ funcao           │     │ prazo_autoavaliacao│
│ ...              │    ││ departamento     │     │ prazo_avaliador   │
└──────────────────┘    ││ grau_funcional   │     │ estado            │
                        ││ categoria_func   │     │ criado_por (FK)   │
                        ││ posicao_chefia   │     └───────┬───────────┘
                        ││ e_lider          │             │
                        ││ report_to_id(FK) │             │
                        │└────────┬─────────┘             │
                        │         │                       │
                        │         │     ┌─────────────────┘
                        │         │     │
                        │    ┌────▼─────▼────────────────────┐
                        │    │       avaliacoes               │
                        │    │───────────────────────────────│
                        │    │ id                             │
                        │    │ ciclo_id (FK)                  │
                        │    │ trabalhador_id (FK)            │
                        │    │ avaliador_id (FK → users)      │──┐
                        │    │ chefe_dept_id (FK → users)     │  │
                        │    │ estado                         │  │
                        │    │ data_autoavaliacao             │  │
                        │    │ data_avaliador                 │  │
                        │    │ data_aprovacao_dept            │  │
                        │    │ data_aprovacao_rh              │  │
                        │    │ pontuacao_final_auto           │  │
                        │    │ pontuacao_final_avaliador      │  │
                        │    │ classificacao_final            │  │
                        │    │ etica_violacao (boolean)       │  │
                        │    │ etica_justificacao             │  │
                        │    │ areas_melhoria                 │  │
                        │    │ comentarios_avaliador_geral    │  │
                        └────│ created_at / updated_at        │  │
                             └──────────┬────────────────────┘  │
                                        │                       │
              ┌─────────────────────────┼───────────────────────┘
              │                         │
              │    ┌────────────────────▼──────────────────┐
              │    │       itens_avaliacao                  │
              │    │──────────────────────────────────────│
              │    │ id                                    │
              │    │ avaliacao_id (FK)                     │
              │    │ indicador_id (FK)                     │
              │    │ classificacao_auto                    │
              │    │ comentario_auto                       │
              │    │ pontuacao_auto (decimal, calculada)   │
              │    │ classificacao_avaliador               │
              │    │ comentario_avaliador                  │
              │    │ pontuacao_avaliador (decimal, calc.)  │
              │    │ peso_aplicado (decimal)               │
              │    └──────────────────────────────────────┘
              │
              │    ┌──────────────────────────────────────┐
              │    │       indicadores                     │
              │    │──────────────────────────────────────│
              │    │ id                                    │
              │    │ nome                                  │
              │    │ descricao                             │
              │    │ aplica_se_a (TODOS | APENAS_LIDERES)  │
              │    │ e_etica (boolean)                     │
              │    │ ordem_exibicao                        │
              │    │ activo (boolean)                      │
              │    └──────────────────────────────────────┘
              │
              │    ┌──────────────────────────────────────┐
              │    │       matriz_pesos                    │
              │    │──────────────────────────────────────│
              │    │ id                                    │
              │    │ ciclo_id (FK)                         │
              │    │ categoria_funcional (string)          │
              │    │ indicador_id (FK)                     │
              │    │ peso (decimal 5,2)                    │
              │    └──────────────────────────────────────┘
              │
              │    ┌──────────────────────────────────────┐
              │    │       contestacoes                    │
              │    │──────────────────────────────────────│
              │    │ id                                    │
              │    │ avaliacao_id (FK)                     │
              │    │ texto_justificacao                    │
              │    │ data_submissao                        │
              │    │ prazo_resposta                        │
              │    │ estado (PENDENTE|ACEITE|REJEITADA)    │
              │    │ resposta_texto                        │
              │    │ respondido_por (FK → users)           │
              │    │ data_resposta                         │
              │    └──────────────────────────────────────┘
              │
              │    ┌──────────────────────────────────────┐
              │    │      registos_one_on_one              │
              │    │──────────────────────────────────────│
              │    │ id                                    │
              │    │ avaliacao_id (FK)                     │
              │    │ trimestre (T1 | T2 | T3)              │
              │    │ data_reuniao                          │
              │    │ pontos_discussao (text)               │
              │    │ accoes_definidas (text)               │
              │    │ avaliador_id (FK → users)             │
              │    └──────────────────────────────────────┘
              │
              │    ┌──────────────────────────────────────┐
              │    │      planos_melhoria                  │
              │    │──────────────────────────────────────│
              │    │ id                                    │
              │    │ avaliacao_id (FK)                     │
              │    │ areas_melhoria (text)                 │
              │    │ accoes_desenvolvimento (text)         │
              │    │ metas_prazos (text)                   │
              │    │ apoio_recursos (text)                 │
              │    │ estado (ACTIVO|CONCLUIDO|CANCELADO)   │
              │    │ data_revisao                          │
              │    └──────────────────────────────────────┘
              │
              │    ┌──────────────────────────────────────┐
              │    │      registos_auditoria               │
              │    │──────────────────────────────────────│
              │    │ id                                    │
              │    │ avaliacao_id (FK, nullable)           │
              │    │ accao (string)                        │
              │    │ estado_anterior (string, nullable)    │
              │    │ estado_novo (string, nullable)        │
              │    │ executado_por (FK → users)            │
              │    │ comentarios (text, nullable)          │
              │    │ ip_address (string)                   │
              │    │ data_hora (timestamp)                 │
              │    └──────────────────────────────────────┘
```

## Migrações Laravel (Ordem de Criação)

### 1. users (Tabela base Laravel — já existente no scaffold)

```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password');
    $table->string('ldap_guid')->nullable()->unique();
    $table->boolean('is_active')->default(true);
    $table->timestamp('password_expires_at')->nullable();
    $table->rememberToken();
    $table->timestamps();
});
```

### 2. ciclos_avaliacao

```php
Schema::create('ciclos_avaliacao', function (Blueprint $table) {
    $table->id();
    $table->string('nome');                              // Ex: "Avaliação Anual 2025"
    $table->integer('ano');
    $table->date('data_inicio');
    $table->date('data_fim');
    $table->date('prazo_autoavaliacao');
    $table->date('prazo_avaliador');
    $table->enum('estado', ['ABERTO', 'FECHADO'])->default('ABERTO');
    $table->foreignId('criado_por')->constrained('users');
    $table->timestamps();
    $table->softDeletes();
});
```

### 3. trabalhadores

```php
Schema::create('trabalhadores', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained('users');
    $table->string('codigo_trabalhador')->unique();       // Ex: "EMP001"
    $table->string('nome');
    $table->string('codigo_posicao')->nullable();
    $table->string('funcao');                              // Ex: "Supervisor de Operações"
    $table->string('departamento');
    $table->string('grau_funcional')->nullable();          // Job Grade
    $table->string('categoria_funcional');                  // Para mapear na MatrizPesos
    $table->string('posicao_chefia')->nullable();          // Report To Position
    $table->unsignedBigInteger('report_to_id')->nullable(); // FK → trabalhadores.id
    $table->boolean('e_lider')->default(false);
    $table->boolean('activo')->default(true);
    $table->timestamps();

    $table->foreign('report_to_id')->references('id')->on('trabalhadores');
});
```

### 4. indicadores

```php
Schema::create('indicadores', function (Blueprint $table) {
    $table->id();
    $table->string('nome');                                // Ex: "Liderança"
    $table->text('descricao');
    $table->enum('aplica_se_a', ['TODOS', 'APENAS_LIDERES'])->default('TODOS');
    $table->boolean('e_etica')->default(false);
    $table->integer('ordem_exibicao');
    $table->boolean('activo')->default(true);
    $table->timestamps();
});
```

### 5. matriz_pesos

```php
Schema::create('matriz_pesos', function (Blueprint $table) {
    $table->id();
    $table->foreignId('ciclo_id')->constrained('ciclos_avaliacao')->cascadeOnDelete();
    $table->string('categoria_funcional');                 // Ex: "Capataz", "Director"
    $table->foreignId('indicador_id')->constrained('indicadores');
    $table->decimal('peso', 5, 2);                         // Ex: 30.00 (%)
    $table->timestamps();

    $table->unique(['ciclo_id', 'categoria_funcional', 'indicador_id'], 'matriz_pesos_unique');
});
```

### 6. avaliacoes

```php
Schema::create('avaliacoes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('ciclo_id')->constrained('ciclos_avaliacao');
    $table->foreignId('trabalhador_id')->constrained('trabalhadores');
    $table->foreignId('avaliador_id')->nullable()->constrained('users');
    $table->foreignId('chefe_dept_id')->nullable()->constrained('users');
    $table->enum('estado', [
        'RASCUNHO', 'AUTO_SUBMETIDA', 'AVAL_RASCUNHO', 'AVAL_SUBMETIDA',
        'REV_DEPART', 'REV_RH', 'APROVADA', 'FEEDBACK_FEITO',
        'CONTESTADA', 'DEVOLVIDA'
    ])->default('RASCUNHO');
    $table->timestamp('data_autoavaliacao')->nullable();
    $table->timestamp('data_avaliador')->nullable();
    $table->timestamp('data_aprovacao_dept')->nullable();
    $table->timestamp('data_aprovacao_rh')->nullable();
    $table->decimal('pontuacao_final_auto', 6, 2)->nullable();
    $table->decimal('pontuacao_final_avaliador', 6, 2)->nullable();
    $table->string('classificacao_final')->nullable();
    $table->boolean('etica_violacao')->default(false);
    $table->text('etica_justificacao')->nullable();
    $table->text('areas_melhoria')->nullable();
    $table->text('comentarios_avaliador_geral')->nullable();
    $table->text('comentarios_devolucao')->nullable();
    $table->timestamps();
    $table->softDeletes();

    $table->unique(['ciclo_id', 'trabalhador_id'], 'avaliacao_ciclo_trabalhador_unique');
});
```

### 7. itens_avaliacao

```php
Schema::create('itens_avaliacao', function (Blueprint $table) {
    $table->id();
    $table->foreignId('avaliacao_id')->constrained('avaliacoes')->cascadeOnDelete();
    $table->foreignId('indicador_id')->constrained('indicadores');
    $table->string('classificacao_auto')->nullable();       // EXCEDE|ATENDE|PARCIAL|NAO_ATENDE
    $table->text('comentario_auto')->nullable();
    $table->decimal('pontuacao_auto', 6, 2)->nullable();
    $table->string('classificacao_avaliador')->nullable();
    $table->text('comentario_avaliador')->nullable();
    $table->decimal('pontuacao_avaliador', 6, 2)->nullable();
    $table->decimal('peso_aplicado', 5, 2);                 // Peso copiado da MatrizPesos
    $table->timestamps();

    $table->unique(['avaliacao_id', 'indicador_id'], 'item_avaliacao_indicador_unique');
});
```

### 8. contestacoes

```php
Schema::create('contestacoes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('avaliacao_id')->constrained('avaliacoes');
    $table->text('texto_justificacao');
    $table->timestamp('data_submissao');
    $table->timestamp('prazo_resposta');                    // data_submissao + 7 dias
    $table->enum('estado', ['PENDENTE', 'ACEITE', 'REJEITADA'])->default('PENDENTE');
    $table->text('resposta_texto')->nullable();
    $table->foreignId('respondido_por')->nullable()->constrained('users');
    $table->timestamp('data_resposta')->nullable();
    $table->timestamps();
});
```

### 9. registos_one_on_one

```php
Schema::create('registos_one_on_one', function (Blueprint $table) {
    $table->id();
    $table->foreignId('avaliacao_id')->constrained('avaliacoes');
    $table->enum('trimestre', ['T1', 'T2', 'T3']);         // Abril, Julho, Outubro
    $table->date('data_reuniao');
    $table->text('pontos_discussao');
    $table->text('accoes_definidas')->nullable();
    $table->foreignId('avaliador_id')->constrained('users');
    $table->timestamps();

    $table->unique(['avaliacao_id', 'trimestre'], 'one_on_one_trimestre_unique');
});
```

### 10. planos_melhoria

```php
Schema::create('planos_melhoria', function (Blueprint $table) {
    $table->id();
    $table->foreignId('avaliacao_id')->constrained('avaliacoes');
    $table->text('areas_melhoria');
    $table->text('accoes_desenvolvimento');
    $table->text('metas_prazos');
    $table->text('apoio_recursos')->nullable();
    $table->enum('estado', ['ACTIVO', 'CONCLUIDO', 'CANCELADO'])->default('ACTIVO');
    $table->date('data_revisao')->nullable();
    $table->timestamps();
});
```

### 11. registos_auditoria

```php
Schema::create('registos_auditoria', function (Blueprint $table) {
    $table->id();
    $table->foreignId('avaliacao_id')->nullable()->constrained('avaliacoes');
    $table->string('accao');                                // Ex: "Estado alterado"
    $table->string('estado_anterior')->nullable();
    $table->string('estado_novo')->nullable();
    $table->foreignId('executado_por')->constrained('users');
    $table->text('comentarios')->nullable();
    $table->string('ip_address')->nullable();
    $table->timestamp('data_hora');
    $table->timestamps();

    $table->index(['avaliacao_id', 'data_hora']);
});
```

## Seeders

### IndicadorSeeder

```php
// Executar no setup inicial
$indicadores = [
    ['nome' => 'Liderança', 'descricao' => 'Capacidade de planear, delegar, comunicar, engajar e influenciar pessoas, resolver conflitos', 'aplica_se_a' => 'APENAS_LIDERES', 'e_etica' => false, 'ordem_exibicao' => 1],
    ['nome' => 'Cumprimento de Tarefas', 'descricao' => 'Capacidade de completar tarefas atribuídas dentro dos prazos e atingir níveis de produtividade', 'aplica_se_a' => 'TODOS', 'e_etica' => false, 'ordem_exibicao' => 2],
    ['nome' => 'Qualidade do Trabalho', 'descricao' => 'Acuracidade, eficácia e qualidade do trabalho entregue, livre de erros', 'aplica_se_a' => 'TODOS', 'e_etica' => false, 'ordem_exibicao' => 3],
    ['nome' => 'Comportamento, Pontualidade e Assiduidade', 'descricao' => 'Atitudes, frequência, pontualidade e cumprimento dos horários estabelecidos', 'aplica_se_a' => 'TODOS', 'e_etica' => false, 'ordem_exibicao' => 4],
    ['nome' => 'Cumprimento de Normas e Procedimentos', 'descricao' => 'Conformidade com políticas, procedimentos e regulamentos', 'aplica_se_a' => 'TODOS', 'e_etica' => false, 'ordem_exibicao' => 5],
    ['nome' => 'Ética', 'descricao' => 'Violação de princípios éticos (Sim/Não). Se Sim, impacta progressão na carreira durante 1 ano.', 'aplica_se_a' => 'TODOS', 'e_etica' => true, 'ordem_exibicao' => 6],
];
```

### MatrizPesosSeeder

```php
// Pesos para Não Líderes (categoria "Não Líder")
// Cumprimento de Tarefas: 30%, Qualidade: 30%, Comportamento: 20%, Normas: 20%

// Pesos para cada categoria de Líder (ver tabela completa no PRD.md secção 3.4)
// Exemplo Capataz: Liderança 15%, Tarefas 30%, Qualidade 25%, Comportamento 15%, Normas 15%
// Exemplo Director: Liderança 35%, Tarefas 20%, Qualidade 20%, Comportamento 15%, Normas 10%
```

### RolePermissionSeeder

```php
// Criar papéis e atribuir permissões (Spatie Permission)
// Seguir o padrão do CDMS Supplier: RoleSeeder + PermissionSeeder
```

## Índices Importantes

```sql
-- Performance queries
CREATE INDEX idx_avaliacoes_ciclo_estado ON avaliacoes(ciclo_id, estado);
CREATE INDEX idx_avaliacoes_trabalhador ON avaliacoes(trabalhador_id);
CREATE INDEX idx_avaliacoes_avaliador ON avaliacoes(avaliador_id);
CREATE INDEX idx_trabalhadores_departamento ON trabalhadores(departamento);
CREATE INDEX idx_trabalhadores_report_to ON trabalhadores(report_to_id);
CREATE INDEX idx_itens_avaliacao_avaliacao ON itens_avaliacao(avaliacao_id);
CREATE INDEX idx_registos_auditoria_avaliacao ON registos_auditoria(avaliacao_id, data_hora);
```

## Classificações (Enums)

```php
// Usar como constantes no Model ou Enum PHP 8.1+

enum ClassificacaoAvaliacao: string
{
    case EXCEDE = 'EXCEDE';             // 125%
    case ATENDE = 'ATENDE';             // 100%
    case PARCIAL = 'PARCIAL';           // 50%
    case NAO_ATENDE = 'NAO_ATENDE';     // 0%
}

enum EstadoAvaliacao: string
{
    case RASCUNHO = 'RASCUNHO';
    case AUTO_SUBMETIDA = 'AUTO_SUBMETIDA';
    case AVAL_RASCUNHO = 'AVAL_RASCUNHO';
    case AVAL_SUBMETIDA = 'AVAL_SUBMETIDA';
    case REV_DEPART = 'REV_DEPART';
    case REV_RH = 'REV_RH';
    case APROVADA = 'APROVADA';
    case FEEDBACK_FEITO = 'FEEDBACK_FEITO';
    case CONTESTADA = 'CONTESTADA';
    case DEVOLVIDA = 'DEVOLVIDA';
}
```
