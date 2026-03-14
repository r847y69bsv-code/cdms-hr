-- CDMS-HR Database Schema for SQL Server
-- Generated from Laravel migrations

USE cdms_hr;
GO

-- 1. Users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    email_verified_at DATETIME2 NULL,
    password NVARCHAR(255) NOT NULL,
    ldap_guid NVARCHAR(255) NULL UNIQUE,
    is_active BIT NOT NULL DEFAULT 1,
    password_changed_at DATETIME2 NULL,
    remember_token NVARCHAR(100) NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL
);
GO

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
GO

-- 2. Password Reset Tokens
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'password_reset_tokens')
CREATE TABLE password_reset_tokens (
    email NVARCHAR(255) PRIMARY KEY,
    token NVARCHAR(255) NOT NULL,
    created_at DATETIME2 NULL
);
GO

-- 3. Sessions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sessions')
CREATE TABLE sessions (
    id NVARCHAR(255) PRIMARY KEY,
    user_id BIGINT NULL,
    ip_address NVARCHAR(45) NULL,
    user_agent NVARCHAR(MAX) NULL,
    payload NVARCHAR(MAX) NOT NULL,
    last_activity INT NOT NULL
);
GO

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);
GO

-- 4. Personal Access Tokens (Sanctum)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'personal_access_tokens')
CREATE TABLE personal_access_tokens (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tokenable_type NVARCHAR(255) NOT NULL,
    tokenable_id BIGINT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    token NVARCHAR(64) NOT NULL UNIQUE,
    abilities NVARCHAR(MAX) NULL,
    last_used_at DATETIME2 NULL,
    expires_at DATETIME2 NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL
);
GO

CREATE INDEX idx_pat_tokenable ON personal_access_tokens(tokenable_type, tokenable_id);
GO

-- 5. Permissions (Spatie)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'permissions')
CREATE TABLE permissions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(125) NOT NULL,
    guard_name NVARCHAR(125) NOT NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT uq_permissions_name_guard UNIQUE (name, guard_name)
);
GO

-- 6. Roles (Spatie)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'roles')
CREATE TABLE roles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(125) NOT NULL,
    guard_name NVARCHAR(125) NOT NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT uq_roles_name_guard UNIQUE (name, guard_name)
);
GO

-- 7. Model Has Permissions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'model_has_permissions')
CREATE TABLE model_has_permissions (
    permission_id BIGINT NOT NULL,
    model_type NVARCHAR(255) NOT NULL,
    model_id BIGINT NOT NULL,
    CONSTRAINT pk_model_has_permissions PRIMARY KEY (permission_id, model_id, model_type),
    CONSTRAINT fk_mhp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_mhp_model ON model_has_permissions(model_id, model_type);
GO

-- 8. Model Has Roles
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'model_has_roles')
CREATE TABLE model_has_roles (
    role_id BIGINT NOT NULL,
    model_type NVARCHAR(255) NOT NULL,
    model_id BIGINT NOT NULL,
    CONSTRAINT pk_model_has_roles PRIMARY KEY (role_id, model_id, model_type),
    CONSTRAINT fk_mhr_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_mhr_model ON model_has_roles(model_id, model_type);
GO

-- 9. Role Has Permissions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'role_has_permissions')
CREATE TABLE role_has_permissions (
    permission_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    CONSTRAINT pk_role_has_permissions PRIMARY KEY (permission_id, role_id),
    CONSTRAINT fk_rhp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_rhp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
GO

-- 10. Ciclos de Avaliacao
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ciclos_avaliacao')
CREATE TABLE ciclos_avaliacao (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ano INT NOT NULL,
    nome NVARCHAR(255) NOT NULL,
    descricao NVARCHAR(MAX) NULL,
    data_inicio_autoavaliacao DATE NOT NULL,
    data_fim_autoavaliacao DATE NOT NULL,
    data_inicio_avaliacao DATE NOT NULL,
    data_fim_avaliacao DATE NOT NULL,
    data_inicio_revisao DATE NOT NULL,
    data_fim_revisao DATE NOT NULL,
    estado NVARCHAR(255) NOT NULL DEFAULT 'planeado',
    criado_por BIGINT NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_ciclos_criado_por FOREIGN KEY (criado_por) REFERENCES users(id) ON DELETE SET NULL
);
GO

CREATE INDEX idx_ciclos_ano ON ciclos_avaliacao(ano);
CREATE INDEX idx_ciclos_estado ON ciclos_avaliacao(estado);
GO

-- 11. Trabalhadores
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'trabalhadores')
CREATE TABLE trabalhadores (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NULL,
    numero_funcionario NVARCHAR(255) NOT NULL UNIQUE,
    nome_completo NVARCHAR(255) NOT NULL,
    departamento NVARCHAR(255) NOT NULL,
    cargo NVARCHAR(255) NOT NULL,
    categoria NVARCHAR(255) NOT NULL,
    data_admissao DATE NULL,
    superior_directo_id BIGINT NULL,
    is_lider BIT NOT NULL DEFAULT 0,
    nivel_lideranca NVARCHAR(255) NOT NULL DEFAULT 'nao_lider',
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_trab_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_trab_superior FOREIGN KEY (superior_directo_id) REFERENCES trabalhadores(id) ON DELETE NO ACTION
);
GO

CREATE INDEX idx_trab_numero ON trabalhadores(numero_funcionario);
CREATE INDEX idx_trab_departamento ON trabalhadores(departamento);
CREATE INDEX idx_trab_categoria ON trabalhadores(categoria);
CREATE INDEX idx_trab_nivel_lideranca ON trabalhadores(nivel_lideranca);
GO

-- 12. Indicadores
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'indicadores')
CREATE TABLE indicadores (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    codigo NVARCHAR(255) NOT NULL UNIQUE,
    nome NVARCHAR(255) NOT NULL,
    descricao NVARCHAR(MAX) NULL,
    ordem INT NOT NULL DEFAULT 0,
    activo BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL
);
GO

CREATE INDEX idx_indicadores_codigo ON indicadores(codigo);
CREATE INDEX idx_indicadores_ordem ON indicadores(ordem);
GO

-- 13. Matriz de Pesos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'matriz_pesos')
CREATE TABLE matriz_pesos (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    categoria NVARCHAR(255) NOT NULL,
    indicador_id BIGINT NOT NULL,
    peso DECIMAL(5,2) NOT NULL,
    descricao_categoria NVARCHAR(255) NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT uq_matriz_categoria_indicador UNIQUE (categoria, indicador_id),
    CONSTRAINT fk_matriz_indicador FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_matriz_categoria ON matriz_pesos(categoria);
GO

-- 14. Avaliacoes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'avaliacoes')
CREATE TABLE avaliacoes (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ciclo_id BIGINT NOT NULL,
    trabalhador_id BIGINT NOT NULL,
    avaliador_id BIGINT NULL,
    revisor_departamental_id BIGINT NULL,
    revisor_rh_id BIGINT NULL,
    estado NVARCHAR(255) NOT NULL DEFAULT 'rascunho',
    pontuacao_auto DECIMAL(5,2) NULL,
    pontuacao_avaliador DECIMAL(5,2) NULL,
    pontuacao_final DECIMAL(5,2) NULL,
    classificacao_final NVARCHAR(255) NULL,
    data_submissao_auto DATETIME2 NULL,
    data_submissao_avaliador DATETIME2 NULL,
    data_revisao_departamental DATETIME2 NULL,
    data_revisao_rh DATETIME2 NULL,
    data_feedback DATETIME2 NULL,
    observacoes_trabalhador NVARCHAR(MAX) NULL,
    observacoes_avaliador NVARCHAR(MAX) NULL,
    observacoes_revisor NVARCHAR(MAX) NULL,
    observacoes_rh NVARCHAR(MAX) NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT uq_aval_ciclo_trabalhador UNIQUE (ciclo_id, trabalhador_id),
    CONSTRAINT fk_aval_ciclo FOREIGN KEY (ciclo_id) REFERENCES ciclos_avaliacao(id) ON DELETE CASCADE,
    CONSTRAINT fk_aval_trabalhador FOREIGN KEY (trabalhador_id) REFERENCES trabalhadores(id) ON DELETE NO ACTION,
    CONSTRAINT fk_aval_avaliador FOREIGN KEY (avaliador_id) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT fk_aval_revisor_dept FOREIGN KEY (revisor_departamental_id) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT fk_aval_revisor_rh FOREIGN KEY (revisor_rh_id) REFERENCES users(id) ON DELETE NO ACTION
);
GO

CREATE INDEX idx_aval_estado ON avaliacoes(estado);
CREATE INDEX idx_aval_classificacao ON avaliacoes(classificacao_final);
GO

-- 15. Itens de Avaliacao
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'itens_avaliacao')
CREATE TABLE itens_avaliacao (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    avaliacao_id BIGINT NOT NULL,
    indicador_id BIGINT NOT NULL,
    pontuacao_auto INT NULL,
    justificacao_auto NVARCHAR(MAX) NULL,
    pontuacao_avaliador INT NULL,
    justificacao_avaliador NVARCHAR(MAX) NULL,
    pontuacao_final INT NULL,
    peso_aplicado DECIMAL(5,2) NULL,
    pontuacao_ponderada DECIMAL(5,2) NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT uq_item_aval_indicador UNIQUE (avaliacao_id, indicador_id),
    CONSTRAINT fk_item_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES avaliacoes(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_indicador FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE
);
GO

-- 16. Contestacoes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'contestacoes')
CREATE TABLE contestacoes (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    avaliacao_id BIGINT NOT NULL,
    motivo NVARCHAR(255) NOT NULL,
    descricao NVARCHAR(MAX) NOT NULL,
    estado NVARCHAR(255) NOT NULL DEFAULT 'pendente',
    resposta NVARCHAR(MAX) NULL,
    respondido_por BIGINT NULL,
    data_resposta DATETIME2 NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_contest_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES avaliacoes(id) ON DELETE CASCADE,
    CONSTRAINT fk_contest_respondido FOREIGN KEY (respondido_por) REFERENCES users(id) ON DELETE SET NULL
);
GO

CREATE INDEX idx_contestacoes_estado ON contestacoes(estado);
GO

-- 17. Registos One-on-One
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'registos_one_on_one')
CREATE TABLE registos_one_on_one (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    avaliacao_id BIGINT NOT NULL,
    data_reuniao DATETIME2 NOT NULL,
    duracao_minutos INT NULL,
    topicos_discutidos NVARCHAR(MAX) NULL,
    accoes_acordadas NVARCHAR(MAX) NULL,
    notas_privadas NVARCHAR(MAX) NULL,
    criado_por BIGINT NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_ooo_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES avaliacoes(id) ON DELETE CASCADE,
    CONSTRAINT fk_ooo_criado_por FOREIGN KEY (criado_por) REFERENCES users(id) ON DELETE SET NULL
);
GO

CREATE INDEX idx_ooo_data_reuniao ON registos_one_on_one(data_reuniao);
GO

-- 18. Planos de Melhoria
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'planos_melhoria')
CREATE TABLE planos_melhoria (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    avaliacao_id BIGINT NOT NULL,
    area_melhoria NVARCHAR(255) NOT NULL,
    objectivo NVARCHAR(MAX) NOT NULL,
    accoes NVARCHAR(MAX) NULL,
    recursos_necessarios NVARCHAR(MAX) NULL,
    prazo DATE NULL,
    estado NVARCHAR(255) NOT NULL DEFAULT 'planeado',
    progresso INT NOT NULL DEFAULT 0,
    notas_acompanhamento NVARCHAR(MAX) NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_plano_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES avaliacoes(id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_planos_estado ON planos_melhoria(estado);
CREATE INDEX idx_planos_prazo ON planos_melhoria(prazo);
GO

-- 19. Registos de Auditoria
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'registos_auditoria')
CREATE TABLE registos_auditoria (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NULL,
    accao NVARCHAR(255) NOT NULL,
    tabela NVARCHAR(255) NULL,
    registo_id BIGINT NULL,
    dados_antigos NVARCHAR(MAX) NULL,
    dados_novos NVARCHAR(MAX) NULL,
    ip_address NVARCHAR(45) NULL,
    user_agent NVARCHAR(MAX) NULL,
    created_at DATETIME2 NULL,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
GO

CREATE INDEX idx_audit_user ON registos_auditoria(user_id);
CREATE INDEX idx_audit_accao ON registos_auditoria(accao);
CREATE INDEX idx_audit_tabela ON registos_auditoria(tabela);
CREATE INDEX idx_audit_created ON registos_auditoria(created_at);
GO

-- 20. Activity Log (Spatie)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'activity_log')
CREATE TABLE activity_log (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    log_name NVARCHAR(255) NULL,
    description NVARCHAR(MAX) NOT NULL,
    subject_type NVARCHAR(255) NULL,
    subject_id BIGINT NULL,
    causer_type NVARCHAR(255) NULL,
    causer_id BIGINT NULL,
    properties NVARCHAR(MAX) NULL,
    batch_uuid UNIQUEIDENTIFIER NULL,
    event NVARCHAR(255) NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL
);
GO

CREATE INDEX idx_activity_log_name ON activity_log(log_name);
CREATE INDEX idx_activity_subject ON activity_log(subject_type, subject_id);
CREATE INDEX idx_activity_causer ON activity_log(causer_type, causer_id);
GO

-- 21. Notifications
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
CREATE TABLE notifications (
    id UNIQUEIDENTIFIER PRIMARY KEY,
    type NVARCHAR(255) NOT NULL,
    notifiable_type NVARCHAR(255) NOT NULL,
    notifiable_id BIGINT NOT NULL,
    data NVARCHAR(MAX) NOT NULL,
    read_at DATETIME2 NULL,
    created_at DATETIME2 NULL,
    updated_at DATETIME2 NULL
);
GO

CREATE INDEX idx_notifications_notifiable ON notifications(notifiable_type, notifiable_id);
GO

-- 22. Cache
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cache')
CREATE TABLE cache (
    [key] NVARCHAR(255) PRIMARY KEY,
    value NVARCHAR(MAX) NOT NULL,
    expiration INT NOT NULL
);
GO

-- 23. Cache Locks
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cache_locks')
CREATE TABLE cache_locks (
    [key] NVARCHAR(255) PRIMARY KEY,
    owner NVARCHAR(255) NOT NULL,
    expiration INT NOT NULL
);
GO

-- 24. Jobs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'jobs')
CREATE TABLE jobs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    queue NVARCHAR(255) NOT NULL,
    payload NVARCHAR(MAX) NOT NULL,
    attempts TINYINT NOT NULL,
    reserved_at INT NULL,
    available_at INT NOT NULL,
    created_at INT NOT NULL
);
GO

CREATE INDEX idx_jobs_queue ON jobs(queue);
GO

-- 25. Job Batches
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'job_batches')
CREATE TABLE job_batches (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    total_jobs INT NOT NULL,
    pending_jobs INT NOT NULL,
    failed_jobs INT NOT NULL,
    failed_job_ids NVARCHAR(MAX) NOT NULL,
    options NVARCHAR(MAX) NULL,
    cancelled_at INT NULL,
    created_at INT NOT NULL,
    finished_at INT NULL
);
GO

-- 26. Failed Jobs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'failed_jobs')
CREATE TABLE failed_jobs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    uuid NVARCHAR(255) NOT NULL UNIQUE,
    connection NVARCHAR(MAX) NOT NULL,
    queue NVARCHAR(MAX) NOT NULL,
    payload NVARCHAR(MAX) NOT NULL,
    exception NVARCHAR(MAX) NOT NULL,
    failed_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- 27. Laravel Migrations table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'migrations')
CREATE TABLE migrations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    migration NVARCHAR(255) NOT NULL,
    batch INT NOT NULL
);
GO

PRINT 'All tables created successfully!';
GO
