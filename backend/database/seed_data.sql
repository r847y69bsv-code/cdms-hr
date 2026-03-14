-- CDMS-HR Seed Data for SQL Server
-- Based on Laravel Seeders

USE cdms_hr;
GO

-- Clear existing data (in reverse order of dependencies)
DELETE FROM role_has_permissions;
DELETE FROM model_has_roles;
DELETE FROM model_has_permissions;
DELETE FROM matriz_pesos;
DELETE FROM trabalhadores;
DELETE FROM indicadores;
DELETE FROM roles;
DELETE FROM permissions;
DELETE FROM users;
GO

-- 1. Insert Permissions
SET IDENTITY_INSERT permissions ON;
INSERT INTO permissions (id, name, guard_name, created_at, updated_at) VALUES
(1, 'acesso modulo-avaliacao', 'sanctum', GETDATE(), GETDATE()),
(2, 'criar autoavaliacao', 'sanctum', GETDATE(), GETDATE()),
(3, 'editar autoavaliacao', 'sanctum', GETDATE(), GETDATE()),
(4, 'submeter autoavaliacao', 'sanctum', GETDATE(), GETDATE()),
(5, 'ver avaliacoes proprias', 'sanctum', GETDATE(), GETDATE()),
(6, 'contestar avaliacao', 'sanctum', GETDATE(), GETDATE()),
(7, 'acesso painel-avaliador', 'sanctum', GETDATE(), GETDATE()),
(8, 'ver avaliacoes equipa', 'sanctum', GETDATE(), GETDATE()),
(9, 'criar avaliacao', 'sanctum', GETDATE(), GETDATE()),
(10, 'editar avaliacao', 'sanctum', GETDATE(), GETDATE()),
(11, 'submeter avaliacao', 'sanctum', GETDATE(), GETDATE()),
(12, 'registar one-on-one', 'sanctum', GETDATE(), GETDATE()),
(13, 'criar plano-melhoria', 'sanctum', GETDATE(), GETDATE()),
(14, 'acesso revisao-departamental', 'sanctum', GETDATE(), GETDATE()),
(15, 'aprovar avaliacao-departamento', 'sanctum', GETDATE(), GETDATE()),
(16, 'rejeitar avaliacao-departamento', 'sanctum', GETDATE(), GETDATE()),
(17, 'ver resumo-departamento', 'sanctum', GETDATE(), GETDATE()),
(18, 'acesso modulo-rh', 'sanctum', GETDATE(), GETDATE()),
(19, 'gerir ciclos', 'sanctum', GETDATE(), GETDATE()),
(20, 'criar ciclo', 'sanctum', GETDATE(), GETDATE()),
(21, 'editar ciclo', 'sanctum', GETDATE(), GETDATE()),
(22, 'activar ciclo', 'sanctum', GETDATE(), GETDATE()),
(23, 'ver todas-avaliacoes', 'sanctum', GETDATE(), GETDATE()),
(24, 'aprovar avaliacao-rh', 'sanctum', GETDATE(), GETDATE()),
(25, 'rejeitar avaliacao-rh', 'sanctum', GETDATE(), GETDATE()),
(26, 'gerar relatorios', 'sanctum', GETDATE(), GETDATE()),
(27, 'exportar dados', 'sanctum', GETDATE(), GETDATE()),
(28, 'gerir configuracoes-rh', 'sanctum', GETDATE(), GETDATE()),
(29, 'acesso administracao', 'sanctum', GETDATE(), GETDATE()),
(30, 'gerir utilizadores', 'sanctum', GETDATE(), GETDATE()),
(31, 'criar utilizador', 'sanctum', GETDATE(), GETDATE()),
(32, 'editar utilizador', 'sanctum', GETDATE(), GETDATE()),
(33, 'desactivar utilizador', 'sanctum', GETDATE(), GETDATE()),
(34, 'gerir roles', 'sanctum', GETDATE(), GETDATE()),
(35, 'gerir permissoes', 'sanctum', GETDATE(), GETDATE()),
(36, 'ver logs-auditoria', 'sanctum', GETDATE(), GETDATE()),
(37, 'gerir configuracoes-sistema', 'sanctum', GETDATE(), GETDATE()),
(38, 'importar trabalhadores', 'sanctum', GETDATE(), GETDATE()),
(39, 'importar avaliacoes', 'sanctum', GETDATE(), GETDATE());
SET IDENTITY_INSERT permissions OFF;
GO

-- 2. Insert Roles
SET IDENTITY_INSERT roles ON;
INSERT INTO roles (id, name, guard_name, created_at, updated_at) VALUES
(1, 'trabalhador', 'sanctum', GETDATE(), GETDATE()),
(2, 'avaliador', 'sanctum', GETDATE(), GETDATE()),
(3, 'chefe-departamento', 'sanctum', GETDATE(), GETDATE()),
(4, 'gestor-rh', 'sanctum', GETDATE(), GETDATE()),
(5, 'admin', 'sanctum', GETDATE(), GETDATE());
SET IDENTITY_INSERT roles OFF;
GO

-- 3. Assign permissions to roles
-- Trabalhador (role_id = 1)
INSERT INTO role_has_permissions (permission_id, role_id) VALUES (1, 1), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1);

-- Avaliador (role_id = 2) - herda trabalhador + painel avaliador
INSERT INTO role_has_permissions (permission_id, role_id) VALUES
(1, 2), (2, 2), (3, 2), (4, 2), (5, 2), (6, 2),
(7, 2), (8, 2), (9, 2), (10, 2), (11, 2), (12, 2), (13, 2);

-- Chefe Departamento (role_id = 3) - herda avaliador + revisao departamental
INSERT INTO role_has_permissions (permission_id, role_id) VALUES
(1, 3), (2, 3), (3, 3), (4, 3), (5, 3), (6, 3),
(7, 3), (8, 3), (9, 3), (10, 3), (11, 3), (12, 3), (13, 3),
(14, 3), (15, 3), (16, 3), (17, 3);

-- Gestor RH (role_id = 4) - modulo RH completo
INSERT INTO role_has_permissions (permission_id, role_id) VALUES
(1, 4), (5, 4),
(18, 4), (19, 4), (20, 4), (21, 4), (22, 4), (23, 4), (24, 4), (25, 4), (26, 4), (27, 4), (28, 4),
(38, 4), (39, 4);

-- Admin (role_id = 5) - todas as permissoes
INSERT INTO role_has_permissions (permission_id, role_id)
SELECT id, 5 FROM permissions;
GO

-- 4. Insert Users (password = 'password' hashed with bcrypt)
-- Note: The hash below is for 'password' - you may need to regenerate via Laravel
SET IDENTITY_INSERT users ON;
INSERT INTO users (id, name, email, password, ldap_guid, is_active, email_verified_at, password_changed_at, created_at, updated_at) VALUES
(1, N'Administrador do Sistema', 'admin@cornelder.co.mz', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'local-admin-001', 1, GETDATE(), GETDATE(), GETDATE(), GETDATE()),
(2, N'Gestor de Recursos Humanos', 'rh@cornelder.co.mz', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'local-rh-002', 1, GETDATE(), GETDATE(), GETDATE(), GETDATE()),
(3, N'João Silva', 'chefe.operacoes@cornelder.co.mz', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'local-chefe-003', 1, GETDATE(), GETDATE(), GETDATE(), GETDATE()),
(4, N'Maria Santos', 'supervisor.logistica@cornelder.co.mz', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'local-super-004', 1, GETDATE(), GETDATE(), GETDATE(), GETDATE()),
(5, N'António Machel', 'operador@cornelder.co.mz', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'local-oper-005', 1, GETDATE(), GETDATE(), GETDATE(), GETDATE()),
(6, N'Fátima Mondlane', 'tecnico@cornelder.co.mz', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'local-tec-006', 1, GETDATE(), GETDATE(), GETDATE(), GETDATE());
SET IDENTITY_INSERT users OFF;
GO

-- 5. Assign roles to users
INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES
(5, 'App\Models\User', 1),  -- admin
(4, 'App\Models\User', 2),  -- gestor-rh
(3, 'App\Models\User', 3),  -- chefe-departamento
(2, 'App\Models\User', 4),  -- avaliador
(1, 'App\Models\User', 5),  -- trabalhador
(1, 'App\Models\User', 6);  -- trabalhador
GO

-- 6. Insert Indicadores
SET IDENTITY_INSERT indicadores ON;
INSERT INTO indicadores (id, codigo, nome, descricao, ordem, activo, created_at, updated_at) VALUES
(1, 'qualidade', N'Qualidade do Trabalho', N'Avalia a precisão, rigor e excelência no cumprimento das tarefas atribuídas. Considera a atenção aos detalhes, a conformidade com os padrões estabelecidos e a ausência de erros.', 1, 1, GETDATE(), GETDATE()),
(2, 'produtividade', N'Produtividade', N'Mede o volume de trabalho realizado dentro dos prazos estabelecidos. Avalia a capacidade de gerir múltiplas tarefas, cumprir metas e optimizar o uso do tempo.', 2, 1, GETDATE(), GETDATE()),
(3, 'responsabilidade', N'Responsabilidade e Compromisso', N'Avalia o grau de comprometimento com as funções, a iniciativa demonstrada, a capacidade de assumir responsabilidades e a proactividade na resolução de problemas.', 3, 1, GETDATE(), GETDATE()),
(4, 'assiduidade', N'Assiduidade e Pontualidade', N'Considera a regularidade da presença no trabalho, o cumprimento dos horários estabelecidos e a gestão adequada de ausências justificadas.', 4, 1, GETDATE(), GETDATE()),
(5, 'conhecimentos', N'Conhecimentos Técnicos', N'Avalia o domínio das competências técnicas necessárias para a função, a actualização contínua de conhecimentos e a capacidade de aplicar conhecimentos na prática.', 5, 1, GETDATE(), GETDATE()),
(6, 'relacionamento', N'Relacionamento Interpessoal', N'Mede a capacidade de trabalhar em equipa, comunicar eficazmente, colaborar com colegas e manter relações profissionais positivas.', 6, 1, GETDATE(), GETDATE());
SET IDENTITY_INSERT indicadores OFF;
GO

-- 7. Insert Matriz de Pesos
SET IDENTITY_INSERT matriz_pesos ON;
-- nao_lider
INSERT INTO matriz_pesos (id, categoria, indicador_id, peso, descricao_categoria, created_at, updated_at) VALUES
(1, 'nao_lider', 1, 20.00, N'Trabalhador sem funções de liderança', GETDATE(), GETDATE()),
(2, 'nao_lider', 2, 20.00, N'Trabalhador sem funções de liderança', GETDATE(), GETDATE()),
(3, 'nao_lider', 3, 15.00, N'Trabalhador sem funções de liderança', GETDATE(), GETDATE()),
(4, 'nao_lider', 4, 20.00, N'Trabalhador sem funções de liderança', GETDATE(), GETDATE()),
(5, 'nao_lider', 5, 15.00, N'Trabalhador sem funções de liderança', GETDATE(), GETDATE()),
(6, 'nao_lider', 6, 10.00, N'Trabalhador sem funções de liderança', GETDATE(), GETDATE()),
-- supervisor
(7, 'supervisor', 1, 18.00, N'Supervisor de equipa', GETDATE(), GETDATE()),
(8, 'supervisor', 2, 18.00, N'Supervisor de equipa', GETDATE(), GETDATE()),
(9, 'supervisor', 3, 18.00, N'Supervisor de equipa', GETDATE(), GETDATE()),
(10, 'supervisor', 4, 15.00, N'Supervisor de equipa', GETDATE(), GETDATE()),
(11, 'supervisor', 5, 16.00, N'Supervisor de equipa', GETDATE(), GETDATE()),
(12, 'supervisor', 6, 15.00, N'Supervisor de equipa', GETDATE(), GETDATE()),
-- chefe_seccao
(13, 'chefe_seccao', 1, 17.00, N'Chefe de Secção', GETDATE(), GETDATE()),
(14, 'chefe_seccao', 2, 17.00, N'Chefe de Secção', GETDATE(), GETDATE()),
(15, 'chefe_seccao', 3, 20.00, N'Chefe de Secção', GETDATE(), GETDATE()),
(16, 'chefe_seccao', 4, 12.00, N'Chefe de Secção', GETDATE(), GETDATE()),
(17, 'chefe_seccao', 5, 17.00, N'Chefe de Secção', GETDATE(), GETDATE()),
(18, 'chefe_seccao', 6, 17.00, N'Chefe de Secção', GETDATE(), GETDATE()),
-- chefe_departamento
(19, 'chefe_departamento', 1, 15.00, N'Chefe de Departamento', GETDATE(), GETDATE()),
(20, 'chefe_departamento', 2, 15.00, N'Chefe de Departamento', GETDATE(), GETDATE()),
(21, 'chefe_departamento', 3, 22.00, N'Chefe de Departamento', GETDATE(), GETDATE()),
(22, 'chefe_departamento', 4, 10.00, N'Chefe de Departamento', GETDATE(), GETDATE()),
(23, 'chefe_departamento', 5, 18.00, N'Chefe de Departamento', GETDATE(), GETDATE()),
(24, 'chefe_departamento', 6, 20.00, N'Chefe de Departamento', GETDATE(), GETDATE()),
-- director
(25, 'director', 1, 15.00, N'Director', GETDATE(), GETDATE()),
(26, 'director', 2, 15.00, N'Director', GETDATE(), GETDATE()),
(27, 'director', 3, 25.00, N'Director', GETDATE(), GETDATE()),
(28, 'director', 4, 8.00, N'Director', GETDATE(), GETDATE()),
(29, 'director', 5, 17.00, N'Director', GETDATE(), GETDATE()),
(30, 'director', 6, 20.00, N'Director', GETDATE(), GETDATE()),
-- director_geral
(31, 'director_geral', 1, 15.00, N'Director Geral', GETDATE(), GETDATE()),
(32, 'director_geral', 2, 12.00, N'Director Geral', GETDATE(), GETDATE()),
(33, 'director_geral', 3, 28.00, N'Director Geral', GETDATE(), GETDATE()),
(34, 'director_geral', 4, 5.00, N'Director Geral', GETDATE(), GETDATE()),
(35, 'director_geral', 5, 15.00, N'Director Geral', GETDATE(), GETDATE()),
(36, 'director_geral', 6, 25.00, N'Director Geral', GETDATE(), GETDATE());
SET IDENTITY_INSERT matriz_pesos OFF;
GO

-- 8. Insert Trabalhadores
SET IDENTITY_INSERT trabalhadores ON;
INSERT INTO trabalhadores (id, user_id, numero_funcionario, nome_completo, departamento, cargo, categoria, data_admissao, superior_directo_id, is_lider, nivel_lideranca, created_at, updated_at) VALUES
(1, 3, 'COR001', N'João Silva', N'Operações', N'Chefe de Departamento de Operações', 'chefe_departamento', '2015-03-15', NULL, 1, 'chefe_departamento', GETDATE(), GETDATE()),
(2, 4, 'COR002', N'Maria Santos', N'Operações', N'Supervisora de Logística', 'supervisor', '2018-06-01', 1, 1, 'supervisor', GETDATE(), GETDATE()),
(3, 5, 'COR003', N'António Machel', N'Operações', N'Operador de Equipamentos', 'nao_lider', '2020-01-10', 2, 0, 'nao_lider', GETDATE(), GETDATE()),
(4, 6, 'COR004', N'Fátima Mondlane', N'Operações', N'Técnica de Manutenção', 'nao_lider', '2021-04-20', 2, 0, 'nao_lider', GETDATE(), GETDATE());
SET IDENTITY_INSERT trabalhadores OFF;
GO

-- 9. Insert migration records
INSERT INTO migrations (migration, batch) VALUES
('2024_01_01_000001_create_users_table', 1),
('2024_01_01_000002_create_personal_access_tokens_table', 1),
('2024_01_01_000003_create_permission_tables', 1),
('2024_01_01_000004_create_ciclos_avaliacao_table', 1),
('2024_01_01_000005_create_trabalhadores_table', 1),
('2024_01_01_000006_create_indicadores_table', 1),
('2024_01_01_000007_create_matriz_pesos_table', 1),
('2024_01_01_000008_create_avaliacoes_table', 1),
('2024_01_01_000009_create_itens_avaliacao_table', 1),
('2024_01_01_000010_create_contestacoes_table', 1),
('2024_01_01_000011_create_registos_one_on_one_table', 1),
('2024_01_01_000012_create_planos_melhoria_table', 1),
('2024_01_01_000013_create_registos_auditoria_table', 1),
('2024_01_01_000014_create_activity_log_table', 1),
('2024_01_01_000015_create_notifications_table', 1),
('2024_01_01_000016_create_cache_table', 1),
('2024_01_01_000017_create_jobs_table', 1);
GO

PRINT 'Seed data inserted successfully!';
PRINT '';
PRINT 'Test Users:';
PRINT '  admin@cornelder.co.mz / password (admin)';
PRINT '  rh@cornelder.co.mz / password (gestor-rh)';
PRINT '  chefe.operacoes@cornelder.co.mz / password (chefe-departamento)';
PRINT '  supervisor.logistica@cornelder.co.mz / password (avaliador)';
PRINT '  operador@cornelder.co.mz / password (trabalhador)';
PRINT '  tecnico@cornelder.co.mz / password (trabalhador)';
GO
