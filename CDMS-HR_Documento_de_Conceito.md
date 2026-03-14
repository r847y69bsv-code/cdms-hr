# CDMS-HR: Módulo de Avaliação de Desempenho

**Documento de Conceito — Versão 1.0**
**Cornelder de Moçambique, S.A.**
**Direcção de Recursos Humanos / Direcção de ICT**
**Março 2026**

Autor: Ivan Gonçalves — Chefe de Departamento de Desenvolvimento de Aplicações
Classificação: Interno / Confidencial

---

## 1. Resumo Executivo

Este documento apresenta o conceito e a especificação técnica do **CDMS-HR**, um módulo web de Avaliação de Desempenho a ser desenvolvido como parte da plataforma CDMS (Cornelder Document Management System). A aplicação irá digitalizar todo o processo de avaliação de desempenho conforme definido na **Ordem de Serviço N.º 13 de 2025** (Regulamento de Avaliação de Desempenho), substituindo o actual fluxo de trabalho baseado em Excel por um sistema digital integrado, auditável e baseado em permissões.

O módulo permitirá que os trabalhadores preencham a sua autoavaliação, que os avaliadores (chefes directos) submetam as suas avaliações, que os chefes de departamento e os RH revisem e aprovem as avaliações, e que a direcção aceda a dashboards em tempo real com resultados consolidados de todos os departamentos.

A stack tecnológica será idêntica ao módulo CDMS Supplier existente (frontend Next.js 14 + PrimeReact, backend Laravel 11 API), garantindo consistência nas práticas de desenvolvimento, competências da equipa e infraestrutura. A base de dados será SQL Server, numa base de dados dedicada denominada **cdms_hr**.

---

## 2. Contexto e Processo Actual

### 2.1 Enquadramento Regulamentar

Em 08 de Agosto de 2025, a Cornelder publicou o Regulamento de Avaliação de Desempenho através da Ordem de Serviço N.º 13. Este regulamento estabelece um processo de avaliação anual estruturado, abrangendo todos os trabalhadores, divididos em dois grupos: **Líderes** e **Não Líderes**. Cada grupo é avaliado com base em indicadores específicos com pesos diferentes, conforme a categoria funcional do trabalhador.

### 2.2 Processo Manual Actual

O processo de avaliação actual é gerido inteiramente através de folhas de cálculo Excel. O fluxo de trabalho funciona da seguinte forma:

1. Os RH distribuem os formulários Excel de avaliação aos chefes de departamento.
2. Os chefes de departamento encaminham os formulários aos supervisores/chefes directos.
3. O trabalhador preenche a secção de autoavaliação (coluna esquerda), seleccionando uma classificação para cada indicador e adicionando comentários.
4. O formulário é devolvido ao chefe directo, que preenche a secção de avaliação do gestor (coluna direita) com as suas próprias classificações e comentários.
5. O formulário preenchido é enviado ao chefe de departamento para revisão.
6. Os RH recolhem todos os formulários, consolidam manualmente os resultados e produzem relatórios.
7. O formulário final é impresso, assinado por todas as partes (trabalhador, chefe directo, chefe de departamento, RH) e arquivado.

### 2.3 Problemas do Processo Actual

- **Sem acompanhamento centralizado:** os RH não têm visibilidade em tempo real sobre quantas avaliações foram concluídas por departamento.
- **Consolidação manual:** os resultados de centenas de ficheiros Excel têm de ser agregados manualmente para reportar.
- **Problemas de controlo de versões:** múltiplas cópias de formulários circulam por email, gerando confusão sobre qual é a versão actual.
- **Sem registo de auditoria:** as alterações às avaliações não podem ser rastreadas ou verificadas.
- **Propenso a atrasos:** a passagem sequencial entre trabalhador, supervisor e RH cria estrangulamentos.
- **Sem cálculo automático de pontuação:** os pesos e escalas são aplicados através de fórmulas Excel que podem ser acidentalmente modificadas.

---

## 3. Estrutura da Avaliação (conforme Regulamento)

### 3.1 Indicadores de Desempenho

O regulamento define 6 indicadores de desempenho. Os primeiros 5 são pontuados numericamente, enquanto o 6.º (Ética) é uma questão binária com impacto especial:

| # | Indicador | Descrição | Aplica-se a |
|---|-----------|-----------|-------------|
| 1 | **Liderança** | Capacidade de planear, delegar, comunicar, engajar e influenciar pessoas, resolver conflitos | Apenas Líderes |
| 2 | **Cumprimento de Tarefas** | Capacidade de completar tarefas atribuídas dentro dos prazos e atingir níveis de produtividade | Todos |
| 3 | **Qualidade do Trabalho** | Acuracidade, eficácia e qualidade do trabalho entregue, livre de erros | Todos |
| 4 | **Comportamento, Pontualidade e Assiduidade** | Atitudes, frequência, pontualidade e cumprimento dos horários estabelecidos | Todos |
| 5 | **Cumprimento de Normas e Procedimentos** | Conformidade com políticas, procedimentos e regulamentos | Todos |
| 6 | **Ética** | Binário (Sim/Não): se o trabalhador violou princípios éticos. Se SIM, impacta a progressão na carreira durante 1 ano | Todos |

### 3.2 Escala de Avaliação

| Classificação | Multiplicador | Significado |
|---------------|:------------:|-------------|
| **Excede as Expectativas** | 125% | Superou os objectivos estabelecidos, demonstrou proactividade e excelência |
| **Atende as Expectativas** | 100% | Atendeu às expectativas de forma satisfatória, cumpriu a maioria dos objectivos |
| **Atende Parcialmente** | 50% | Desempenho abaixo do esperado, alguns objectivos alcançados mas outros não |
| **Não Atende as Expectativas** | 0% | Não atingiu os critérios mínimos, falhas significativas |

### 3.3 Tabelas de Pesos

#### Não Líderes

| Indicador | Excede (125%) | Atende (100%) | Parcial (50%) | Não Atende (0%) |
|-----------|:------------:|:------------:|:------------:|:--------------:|
| Cumprimento de Tarefas (30%) | 37,5% | 30% | 15% | 0% |
| Qualidade do Trabalho (30%) | 37,5% | 30% | 15% | 0% |
| Comportamento (20%) | N/A | 20% | N/A | 0% |
| Cumprimento de Normas (20%) | N/A | 20% | N/A | 0% |

#### Líderes (exemplos por categoria)

| Categoria | Liderança (%) | Cumpr. Tarefas (%) | Qualidade (%) | Comport. (%) | Normas (%) |
|-----------|:------------:|:-----------------:|:------------:|:-----------:|:----------:|
| Capataz | 15% | 30% | 25% | 15% | 15% |
| Encarregado | 30% | 25% | 20% | 15% | 10% |
| Supervisor (Adm/Manut/Planif) | 25% | 25% | 25% | 15% | 10% |
| Supervisor de Operações | 50% | 20% | 15% | 10% | 5% |
| Superintendente | 35% | 25% | 20% | 10% | 10% |
| Chefe | 35% | 20% | 20% | 15% | 10% |
| Director | 35% | 20% | 20% | 15% | 10% |

A matriz completa de pesos para todas as 13 categorias será configurável no sistema e aplicada automaticamente com base na função do trabalhador.

---

## 4. Conceito da Aplicação: CDMS-HR

### 4.1 Visão

O CDMS-HR será um novo módulo dentro do ecossistema CDMS, acessível na mesma estrutura de URL base. Partilhará o mesmo sistema de autenticação (LDAP + Sanctum), o mesmo template de layout PrimeReact Sakai e o mesmo modelo de permissões baseado em papéis do CDMS Supplier. Será uma aplicação irmã: mesmo aspecto, mesma experiência, mesma infraestrutura, domínio de negócio diferente.

A interface da aplicação será inteiramente em **Português**, incluindo todos os menus, formulários, mensagens de erro, notificações e relatórios.

A base de dados será criada em SQL Server com o nome **cdms_hr**, separada da base de dados do CDMS Supplier, mas no mesmo servidor.

### 4.2 Papéis e Permissões dos Utilizadores

| Papel | Actor | Permissões Principais |
|-------|-------|----------------------|
| **Trabalhador (Avaliado)** | Todos os trabalhadores da Cornelder | Criar autoavaliação, visualizar as suas avaliações, submeter autoavaliação, contestar resultados, visualizar planos de melhoria |
| **Avaliador** | Chefes directos, líderes intermédios | Visualizar avaliações atribuídas, preencher secção do avaliador, submeter avaliação ao chefe de departamento, registar notas das reuniões one-on-one |
| **Chefe de Departamento** | Chefe de Depart. / Director de Área | Rever e aprovar/rejeitar avaliações do seu departamento, visualizar resumo departamental |
| **Gestor de RH** | Equipa de Recursos Humanos | Configurar ciclos de avaliação, gerir indicadores/pesos, aprovar avaliações ao nível do sistema, gerar relatórios, visualizar dashboard global, exportar dados, imprimir formulários |
| **Administrador do Sistema** | Equipa de IT / AppDev | Gerir utilizadores, papéis, permissões, configurações do sistema, configuração LDAP, registos de auditoria |

### 4.3 Fluxo de Trabalho da Avaliação (Digital)

| # | Etapa | Actor | Estado | Acção do Sistema |
|---|-------|-------|--------|------------------|
| 1 | RH abre ciclo de avaliação | RH | ABERTO | Cria ciclo com período (Jan-Dez), prazos e activa os formulários |
| 2 | Trabalhador cria autoavaliação | Trabalhador | RASCUNHO | Selecciona ciclo, sistema pré-preenche dados, classifica cada indicador e adiciona comentários |
| 3 | Trabalhador submete autoavaliação | Trabalhador | AUTO_SUBMETIDA | Bloqueia campos de autoavaliação, notifica chefe directo por email/in-app |
| 4 | Avaliador preenche a sua secção | Avaliador | AVAL_RASCUNHO | Classifica cada indicador, adiciona comentários, sistema calcula pontuações ponderadas |
| 5 | Avaliador submete avaliação | Avaliador | AVAL_SUBMETIDA | Bloqueia campos do avaliador, notifica chefe de departamento |
| 6 | Chefe de Departamento revê | Chefe Dept. | REV_DEPART | Pode aprovar ou devolver para revisão com comentários |
| 7 | RH revisão e aprovação final | RH | REV_RH | RH valida a avaliação, pode aprovar ou devolver |
| 8 | Avaliação finalizada | Sistema | APROVADA | Pontuação final calculada, PDF gerado para impressão e assinatura |
| 9 | Reunião de feedback | Avaliador + Trabalhador | FEEDBACK_FEITO | Data da reunião registada, áreas de melhoria documentadas |
| 10 | Contestação (se aplicável) | Trabalhador | CONTESTADA | Trabalhador submete contestação em 7 dias, desencadeia processo de revisão |

### 4.4 Requisitos Funcionais Chave

#### 4.4.1 Gestão de Ciclos de Avaliação (RH)

- Criar, editar e encerrar ciclos de avaliação anuais
- Definir período de avaliação (ex: Janeiro 2025 a Dezembro 2025)
- Definir prazos para submissão da autoavaliação e submissão do avaliador
- Configurar indicadores e tabelas de pesos por categoria funcional
- Activar/desactivar ciclos de avaliação

#### 4.4.2 Autoavaliação (Trabalhador)

- O trabalhador autentica-se via credenciais LDAP (mesmo que no CDMS)
- O sistema detecta automaticamente os dados do trabalhador: nome, departamento, cargo, função, chefe directo (a partir da integração com o Position Batch)
- O sistema determina se o trabalhador é Líder ou Não Líder com base na função e mostra/oculta o indicador de Liderança
- Para cada indicador: o trabalhador selecciona uma classificação no dropdown e escreve um comentário
- Para Ética: o trabalhador responde Sim/Não sobre se violou normas éticas
- Secção de texto livre para aspectos a serem desenvolvidos/melhorados
- Guardar como rascunho (pode voltar mais tarde) ou submeter ao avaliador

#### 4.4.3 Avaliação pelo Avaliador

- O avaliador visualiza a autoavaliação do trabalhador (apenas leitura) ao lado dos seus campos
- Para cada indicador: selecciona uma classificação e escreve um comentário
- O sistema calcula automaticamente as pontuações ponderadas usando a tabela de pesos
- A classificação final é determinada automaticamente
- O avaliador pode guardar rascunho ou submeter ao chefe de departamento

#### 4.4.4 Fluxo de Aprovação

- O Chefe de Departamento visualiza todas as avaliações do seu departamento, pode aprovar ou devolver com comentários
- Os RH visualizam todas as avaliações de toda a organização, efectuam a aprovação final
- Em cada rejeição, a avaliação retorna à etapa anterior com comentários explicativos
- Registo completo de auditoria: cada mudança de estado é registada com data/hora, utilizador e acção

#### 4.4.5 Módulo de Contestação

- Após aprovação, o trabalhador tem 7 dias para contestar a avaliação
- A contestação é submetida digitalmente com texto de justificação
- Dirigida ao Chefe de Departamento (ou Director de Área se o avaliador foi o Chefe de Dept.)
- Os RH medeiam o processo e validam a decisão final

#### 4.4.6 Dashboard e Relatórios

- **Dashboard de RH:** total de avaliações por departamento, percentagem de conclusão, distribuição por estado, pontuações médias por departamento, violações éticas sinalizadas
- **Dashboard do Chefe de Departamento:** avaliações do seu departamento, estado de conclusão, acções pendentes
- **Gráficos:** barras por departamento, circulares por estado, tendência ano-a-ano
- **Exportação para Excel:** exportação completa de dados para análise dos RH
- **Geração de PDF:** formulário de avaliação imprimível que reproduz o layout actual do Excel, pronto para assinaturas físicas

#### 4.4.7 Registos de Reuniões One-on-One

- Acompanhamento trimestral de reuniões (Abril, Julho, Outubro) conforme o regulamento
- O avaliador regista a data da reunião, pontos de discussão e acções definidas
- Ligado à avaliação anual do trabalhador para contexto

---

## 5. Stack Tecnológica

### 5.1 Frontend

| Componente | Tecnologia | Justificação |
|------------|-----------|-------------|
| Framework | **Next.js 14+ (App Router)** | Igual ao CDMS Supplier. SSR, grupos de rotas, layouts, TypeScript |
| Linguagem | **TypeScript** | Segurança de tipos, igual ao CDMS Supplier |
| Componentes UI | **PrimeReact 10 + Template Sakai** | Mesmo aspecto visual do CDMS. DataTables, formulários, diálogos, menus |
| Layout | **PrimeFlex 3** | Mesmos utilitários flex/grid do CDMS |
| Tema | **lara-light-indigo** | Mesma identidade visual do CDMS |
| Ícones | **PrimeIcons 7** | Mesmo conjunto de ícones do CDMS |
| Cliente HTTP | **Axios** | Instância API centralizada com Bearer token, mesmo padrão do CDMS |
| Armazenamento Auth | **cookies-next** | JWT em cookies, igual ao CDMS |
| Internacionalização | **next-intl** | Interface em PT, com suporte futuro para EN |
| Gráficos | **Chart.js 4** | Visualizações do dashboard, igual ao CDMS |
| Geração de PDF | **@react-pdf/renderer** | Formulários de avaliação imprimíveis |
| Exportação Excel | **ExcelJS** | Exportação de dados de RH |

### 5.2 Backend

| Componente | Tecnologia | Justificação |
|------------|-----------|-------------|
| Framework | **Laravel 11** | Igual ao CDMS Supplier. REST API, Eloquent ORM, migrações, seeders |
| Autenticação | **Laravel Sanctum** | Autenticação API por token, igual ao CDMS |
| LDAP | **LDAPRecord-Laravel 3** | Integração Active Directory para trabalhadores da Cornelder |
| Autorização | **Spatie Permission** | Permissões granulares baseadas em papéis, mesmo padrão do CDMS |
| Base de Dados | **SQL Server (cdms_hr)** | Mesma infraestrutura do CDMS, BD dedicada cdms_hr |
| Registo de Actividade | **Spatie Activity Log** | Registo completo de auditoria para avaliações |
| Notificações | **Laravel Notifications** | Notificações por email e in-app para transições de estado |
| Importação Excel | **Maatwebsite Excel** | Importação de dados do Position Batch |
| Documentação API | **L5-Swagger** | Mesmo padrão de documentação do CDMS |
| Middleware de Segurança | **Rate Limiting, Password Expiry, Audit Log** | Mesma stack de segurança do CDMS |

### 5.3 Infraestrutura

- Mesma infraestrutura de servidores do CDMS Supplier
- Mesmo pipeline de CI/CD e processo de deployment
- Mesmo servidor de base de dados SQL Server, com base de dados separada: **cdms_hr**
- Mesmo servidor LDAP/Active Directory para autenticação
- SQLite para ambiente de desenvolvimento local

---

## 6. Modelo de Dados (Entidades Principais)

As seguintes são as entidades principais da base de dados **cdms_hr**:

| Entidade | Campos Principais |
|----------|-------------------|
| **CicloAvaliacao** | id, nome, ano, data_inicio, data_fim, prazo_autoavaliacao, prazo_avaliador, estado (ABERTO/FECHADO), criado_por |
| **Trabalhador** | id, codigo_trabalhador, nome, codigo_posicao, funcao, departamento, grau_funcional, posicao_chefia, e_lider, user_id (FK) |
| **Indicador** | id, nome, descricao, aplica_se_a (TODOS/APENAS_LIDERES), e_etica (boolean), ordem_exibicao |
| **MatrizPesos** | id, categoria_funcional, indicador_id (FK), peso (decimal), ciclo_id (FK) |
| **Avaliacao** | id, ciclo_id (FK), trabalhador_id (FK), avaliador_id (FK), chefe_dept_id, estado, data_autoavaliacao, data_avaliador, data_aprovacao_dept, data_aprovacao_rh, pontuacao_final, classificacao, areas_melhoria, texto_contestacao, data_contestacao |
| **ItemAvaliacao** | id, avaliacao_id (FK), indicador_id (FK), classificacao_auto, comentario_auto, pontuacao_auto (calculada), classificacao_avaliador, comentario_avaliador, pontuacao_avaliador (calculada), peso_aplicado |
| **RegistoOneOnOne** | id, avaliacao_id (FK), trimestre (T1/T2/T3), data_reuniao, pontos_discussao, accoes_definidas, avaliador_id |
| **PlanoMelhoria (PMI)** | id, avaliacao_id (FK), areas_melhoria, accoes_desenvolvimento, metas_prazos, apoio_recursos, estado, data_revisao |
| **RegistoAuditoria** | id, avaliacao_id (FK), accao, estado_anterior, estado_novo, executado_por, comentarios, data_hora |

---

## 7. Estrutura da Aplicação Frontend

### 7.1 Grupos de Rotas

- **(full-page):** Páginas de autenticação sem barra lateral (login, recuperação de senha, verificação de conta)
- **(main):** Páginas autenticadas com layout de barra lateral (dashboard, avaliações, administração)

### 7.2 Estrutura do Menu Lateral (Baseado em Permissões)

| Módulo | Itens do Menu | Permissão Necessária |
|--------|---------------|---------------------|
| **Dashboard** | Visão Geral | acesso dashboard |
| **As Minhas Avaliações** | Nova Autoavaliação, O Meu Histórico | criar autoavaliacao, ver avaliacoes proprias |
| **Painel do Avaliador** | Avaliações Pendentes, A Minha Equipa | acesso painel-avaliador |
| **Revisão Departamental** | Aprovações Pendentes, Resumo Departamental | acesso revisao-departamental |
| **Módulo de RH** | Ciclos de Avaliação, Todas as Avaliações, Relatórios, Configuração | acesso modulo-rh |
| **One-on-One** | Agendar, Registos | acesso one-on-one |
| **Administração** | Utilizadores, Papéis, Permissões, Configurações, Registos | acesso modulo-admin |

### 7.3 Páginas Chave

**Página do Formulário de Avaliação** — Esta é a página mais crítica. Replicará o layout do formulário Excel de forma digital, com um design de duas colunas: lado esquerdo para a autoavaliação do trabalhador, lado direito para a avaliação do chefe directo. Cada indicador mostrará o texto descritivo, um dropdown para selecção da classificação e uma área de texto para comentários. As pontuações são calculadas em tempo real conforme as classificações são seleccionadas.

**Página do Dashboard** — O dashboard de RH incluirá: gráfico de barras com avaliações concluídas vs. pendentes por departamento, gráfico circular com distribuição por estado, cartão resumo com total de trabalhadores, total de avaliações submetidas, percentagem de conclusão e pontuações médias.

**Vista de Impressão PDF** — Usando @react-pdf/renderer, o sistema gerará um PDF imprimível que reproduz o layout actual do formulário Excel, incluindo todos os dados, pontuações, comentários, classificação final e linhas de assinatura para Trabalhador, Chefe Directo, Chefe de Departamento e RH.

---

## 8. Pontos de Integração

### 8.1 Position Batch / Dados de RH

O ficheiro Position Batch contém 1.762 registos de posições com dados organizacionais ricos. O sistema importará estes dados para preencher automaticamente as informações dos trabalhadores. Campos principais: código do trabalhador, nome, posição, função, departamento, posição de reporte e grau funcional. Esta importação deverá ser repetível para manter os dados actualizados.

### 8.2 LDAP / Active Directory

A autenticação utilizará a mesma integração LDAP do CDMS Supplier, permitindo login com credenciais de rede Cornelder existentes. O utilizador LDAP será associado ao registo do Trabalhador via código do trabalhador.

### 8.3 Notificações por Email

O sistema enviará notificações por email em cada transição do fluxo de trabalho: submissão de autoavaliação, conclusão de avaliação pelo avaliador, aprovação/rejeição pelo chefe de departamento ou RH, e aproximação do prazo de contestação.

---

## 9. Segurança e Confidencialidade

Conforme Artigo 22.º do regulamento, todas as informações são confidenciais. O sistema garantirá:

- **Controlo de acesso baseado em papéis:** trabalhadores vêem apenas as suas avaliações, avaliadores vêem apenas os subordinados directos, chefes de departamento vêem apenas o seu departamento
- **Isolamento de dados:** endpoints da API filtram dados com base no papel e unidade organizacional
- **Registo de auditoria:** cada operação registada com ID do utilizador e data/hora (Spatie Activity Log)
- **Expiração de senha e gestão de sessões:** mesmo middleware do CDMS
- **Rate limiting e middleware de segurança:** mesma stack do CDMS

---

## 10. Marcos de Implementação Propostos

| Fase | Marco | Entregáveis | Duração |
|:----:|-------|-------------|:-------:|
| 1 | Setup e Fundação do Projecto | Scaffolding backend/frontend, integração LDAP, fluxo de auth, esquema BD cdms_hr | 2 semanas |
| 2 | Módulo Central de Avaliação | CRUD ciclos, configuração indicadores/pesos, importação Position Batch, formulários de autoavaliação e avaliação, motor de cálculo | 4 semanas |
| 3 | Fluxo de Trabalho e Aprovação | Máquina de estados, revisão departamental, aprovação RH, notificações, auditoria | 3 semanas |
| 4 | Dashboard e Relatórios | Dashboards com gráficos, geração PDF, exportação Excel, registos one-on-one | 3 semanas |
| 5 | Contestação e PMI | Módulo de contestação, Plano de Melhoramento Individual, fluxo de revisão | 2 semanas |
| 6 | Testes e Deployment | UAT com RH, correcção de bugs, optimização, deployment produção, formação | 2 semanas |

**Duração total estimada: 16 semanas (4 meses)**, com uma equipa de 2-3 programadores a trabalhar em paralelo no frontend e backend.

---

## 11. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|:-------:|-----------|
| Problemas de qualidade dos dados do Position Batch | Alto | Validar dados durante importação, sinalizar registos com chefia ou departamento em falta |
| Resistência dos utilizadores ao processo digital | Médio | Sessões de formação, guia do utilizador na app, rollout gradual por departamento |
| Alteração da matriz de pesos a meio do ciclo | Médio | Pesos versionados por ciclo; alterações afectam apenas ciclos futuros |
| Indisponibilidade do LDAP afectando o login | Alto | Mesmo fallback do CDMS; autenticação local como backup |
| Conectividade ao SQL Server a partir do ambiente dev | Baixo | SQLite para desenvolvimento, SQL Server para staging/produção |

---

## 12. Conclusão

O CDMS-HR representa uma extensão natural da plataforma CDMS para a gestão de recursos humanos. Ao reutilizar exactamente a mesma stack tecnológica, template de layout e padrões arquitecturais do módulo CDMS Supplier, minimizamos o risco de desenvolvimento, aproveitamos a experiência existente da equipa e garantimos uma experiência de utilizador consistente em todos os sistemas digitais da Cornelder.

A aplicação implementa directamente os requisitos da Ordem de Serviço N.º 13 de 2025, digitalizando todos os aspectos do processo de avaliação, desde a autoavaliação até à aprovação final, adicionando a transparência, auditabilidade e capacidades de reporte que o regulamento exige mas que são impossíveis de alcançar com folhas de cálculo Excel.

Após aprovação deste conceito, a equipa de desenvolvimento poderá avançar para a especificação técnica detalhada e iniciar a implementação da Fase 1.

---

*Documento elaborado por: **Ivan Gonçalves** — Chefe de Departamento de Desenvolvimento de Aplicações, Cornelder de Moçambique, S.A.*
*Data: Março 2026 | Estado: Rascunho para Revisão*
