# PRD — Requisitos do Produto CDMS-HR

## 1. Resumo

O CDMS-HR digitaliza o processo de avaliação de desempenho da Cornelder de Moçambique conforme a Ordem de Serviço N.º 13 de 2025. Substitui o fluxo manual em Excel por um sistema web com cálculo automático, fluxo de aprovação, dashboards e geração de PDF.

## 2. Papéis de Utilizador

| Papel | Quem | Capacidades |
|-------|------|-------------|
| **Trabalhador** | Todos os colaboradores | Criar autoavaliação, visualizar histórico, submeter ao avaliador, contestar resultado, ver plano de melhoria |
| **Avaliador** | Chefes directos / supervisores | Ver avaliações atribuídas, preencher secção do avaliador, submeter ao chefe de dept., registar one-on-one |
| **Chefe de Departamento** | Directores de área / chefes dept. | Rever e aprovar/rejeitar avaliações do departamento, ver resumo departamental |
| **Gestor de RH** | Equipa de Recursos Humanos | Configurar ciclos, gerir indicadores/pesos, aprovar avaliações, gerar relatórios, dashboard global, exportar Excel, imprimir PDF |
| **Administrador** | Equipa IT/AppDev | Gerir utilizadores, papéis, permissões, configuração LDAP, logs de auditoria |

## 3. Indicadores de Desempenho

### 3.1 Os 6 Indicadores

1. **Liderança** — Apenas Líderes. Capacidade de planear, delegar, comunicar, engajar, resolver conflitos.
2. **Cumprimento de Tarefas** — Todos. Completar tarefas nos prazos, atingir níveis de produtividade.
3. **Qualidade do Trabalho** — Todos. Acuracidade, eficácia, trabalho livre de erros.
4. **Comportamento, Pontualidade e Assiduidade** — Todos. Atitudes, frequência, pontualidade.
5. **Cumprimento de Normas e Procedimentos** — Todos. Conformidade com políticas e regulamentos.
6. **Ética** — Todos. Binário (Sim/Não). Se violou princípios éticos, impacta progressão durante 1 ano.

### 3.2 Escala de Classificação

| Classificação | Multiplicador |
|---------------|:------------:|
| Excede as Expectativas | 125% |
| Atende as Expectativas | 100% |
| Atende Parcialmente | 50% |
| Não Atende as Expectativas | 0% |

### 3.3 Matriz de Pesos — Não Líderes

| Indicador | Peso Base | Excede (125%) | Atende (100%) | Parcial (50%) | Não Atende (0%) |
|-----------|:---------:|:-------------:|:-------------:|:-------------:|:---------------:|
| Cumprimento de Tarefas | 30% | 37,5% | 30% | 15% | 0% |
| Qualidade do Trabalho | 30% | 37,5% | 30% | 15% | 0% |
| Comportamento/Pontualidade | 20% | N/A | 20% | N/A | 0% |
| Cumprimento de Normas | 20% | N/A | 20% | N/A | 0% |

Nota: Para Comportamento e Normas, apenas existem duas classificações possíveis (Atende ou Não Atende).

### 3.4 Matriz de Pesos — Líderes (por categoria funcional)

| Categoria | Liderança | Cumpr. Tarefas | Qualidade | Comportamento | Normas |
|-----------|:---------:|:--------------:|:---------:|:-------------:|:------:|
| Capataz | 15% | 30% | 25% | 15% | 15% |
| Encarregado | 30% | 25% | 20% | 15% | 10% |
| Supervisor Administrativo | 25% | 25% | 25% | 15% | 10% |
| Supervisor de Manutenção | 25% | 25% | 25% | 15% | 10% |
| Supervisor de Planificação | 25% | 25% | 25% | 15% | 10% |
| Supervisor de Operações | 50% | 20% | 15% | 10% | 5% |
| Superintendente | 35% | 25% | 20% | 10% | 10% |
| Chefe | 35% | 20% | 20% | 15% | 10% |
| Director | 35% | 20% | 20% | 15% | 10% |
| Coordenador | 30% | 25% | 20% | 15% | 10% |
| Gestor | 35% | 20% | 20% | 15% | 10% |
| Oficial de Segurança | 25% | 25% | 25% | 15% | 10% |
| Team Leader | 20% | 30% | 25% | 15% | 10% |

A matriz deve ser **configurável** no sistema por ciclo de avaliação.

### 3.5 Fórmula de Cálculo

```
Pontuação Indicador = Peso do Indicador × Multiplicador da Classificação
Pontuação Final = Soma de todas as Pontuações dos Indicadores (excluindo Ética)
```

Classificação final com base na pontuação:
- >= 100%: Excede as Expectativas
- >= 75%: Atende as Expectativas
- >= 50%: Atende Parcialmente
- < 50%: Não Atende as Expectativas

Se Ética = "Sim" (violação ética), regista-se flag especial que impacta progressão.

## 4. Fluxo de Trabalho (Workflow)

### 4.1 Estados

| Estado | Código | Descrição |
|--------|--------|-----------|
| Rascunho | `RASCUNHO` | Trabalhador iniciou mas não submeteu |
| Autoavaliação Submetida | `AUTO_SUBMETIDA` | Trabalhador submeteu ao avaliador |
| Avaliação em Rascunho | `AVAL_RASCUNHO` | Avaliador começou a preencher |
| Avaliação Submetida | `AVAL_SUBMETIDA` | Avaliador submeteu ao chefe de dept. |
| Revisão Departamental | `REV_DEPART` | Chefe de dept. a rever |
| Revisão RH | `REV_RH` | RH a rever para aprovação final |
| Aprovada | `APROVADA` | Avaliação aprovada, PDF pronto |
| Feedback Feito | `FEEDBACK_FEITO` | Reunião de feedback registada |
| Contestada | `CONTESTADA` | Trabalhador contestou em 7 dias |
| Devolvida | `DEVOLVIDA` | Devolvida à etapa anterior com comentários |

### 4.2 Transições Permitidas

```
RASCUNHO           → AUTO_SUBMETIDA        (pelo Trabalhador)
AUTO_SUBMETIDA     → AVAL_RASCUNHO         (pelo Avaliador, ao abrir)
AVAL_RASCUNHO      → AVAL_SUBMETIDA        (pelo Avaliador)
AVAL_SUBMETIDA     → REV_DEPART            (automático)
REV_DEPART         → REV_RH                (pelo Chefe de Dept. - aprovar)
REV_DEPART         → AVAL_RASCUNHO         (pelo Chefe de Dept. - devolver)
REV_RH             → APROVADA              (pelo RH)
REV_RH             → REV_DEPART            (pelo RH - devolver)
APROVADA           → FEEDBACK_FEITO        (pelo Avaliador)
APROVADA           → CONTESTADA            (pelo Trabalhador, dentro de 7 dias)
```

### 4.3 Notificações

Cada transição de estado gera uma notificação:
- **Email** — enviado ao actor da próxima etapa
- **In-app** — badge no ícone de notificações (como no CDMS Supplier)
- **Conteúdo:** nome do trabalhador, departamento, acção necessária, link directo

## 5. Requisitos Funcionais Detalhados

### RF-01: Gestão de Ciclos de Avaliação

- RH cria ciclo: nome, ano, data início, data fim, prazo autoavaliação, prazo avaliador
- RH pode activar/desactivar ciclos
- Apenas 1 ciclo activo por vez
- Configuração de indicadores e pesos associada ao ciclo
- Ao criar ciclo, copiar a última configuração de pesos como base

### RF-02: Autoavaliação

- Trabalhador acede ao ciclo activo
- Sistema pré-preenche: nome, departamento, cargo, função, chefe directo, grau funcional
- Sistema determina Líder/Não Líder automaticamente e mostra/oculta indicador Liderança
- Para cada indicador: dropdown de classificação + campo de comentário (obrigatório)
- Para Ética: resposta Sim/Não + campo de justificação se Sim
- Campo de texto livre: "Aspectos a Desenvolver/Melhorar"
- Botão "Guardar Rascunho" e botão "Submeter"
- Após submissão: campos bloqueados, notificação ao avaliador

### RF-03: Avaliação pelo Avaliador

- Avaliador vê lista de avaliações pendentes dos seus subordinados
- Ao abrir: layout de duas colunas — autoavaliação (apenas leitura) à esquerda, avaliação do avaliador à direita
- Para cada indicador: dropdown + comentário
- Cálculo automático de pontuação ponderada em tempo real
- Classificação final calculada automaticamente
- Guardar rascunho ou submeter ao chefe de departamento

### RF-04: Revisão e Aprovação

- Chefe de Departamento vê todas as avaliações do seu departamento
- Pode aprovar (avança para RH) ou devolver com comentários
- RH vê todas as avaliações da organização
- RH pode aprovar (finaliza) ou devolver com comentários
- Cada devolução retorna à etapa anterior com registo de motivo

### RF-05: Contestação

- Após APROVADA, trabalhador tem 7 dias para contestar
- Submete texto de justificação
- Dirigida ao Chefe de Dept. (ou Director de Área se avaliador foi o Chefe)
- RH medeia e regista decisão final
- Prazo controlado pelo sistema (countdown visível)

### RF-06: Dashboard

**Dashboard RH (global):**
- Total de avaliações por estado (gráfico circular)
- Avaliações concluídas vs. pendentes por departamento (gráfico de barras)
- Percentagem de conclusão global
- Pontuação média por departamento
- Violações éticas sinalizadas
- Filtro por ciclo e departamento

**Dashboard Chefe de Departamento:**
- Avaliações do departamento por estado
- Acções pendentes
- Percentagem de conclusão do departamento

**Dashboard Avaliador:**
- Lista de subordinados com estado da avaliação
- Próximas reuniões one-on-one

### RF-07: Geração de PDF

- Formulário de avaliação em PDF que replica o layout actual do Excel
- Dados completos: informações do trabalhador, todas as classificações e comentários (auto + avaliador), pontuações ponderadas, classificação final
- Linhas de assinatura: Trabalhador, Chefe Directo, Chefe de Departamento, RH
- Usar @react-pdf/renderer para geração client-side

### RF-08: Exportação Excel

- RH pode exportar dados completos para Excel
- Filtros: ciclo, departamento, estado
- Colunas: dados do trabalhador, todas as pontuações, classificação final, estado

### RF-09: Reuniões One-on-One

- Acompanhamento trimestral (Abril, Julho, Outubro) conforme regulamento
- Avaliador regista: data, pontos de discussão, acções definidas
- Ligado à avaliação anual do trabalhador
- Histórico visível na avaliação

### RF-10: Importação Position Batch

- Upload de ficheiro Excel com dados de posições (1.762+ registos)
- Mapeamento de colunas: código trabalhador, nome, posição, função, departamento, grau, chefia
- Determinar automaticamente se é Líder com base na função
- Importação repetível (actualizar registos existentes, adicionar novos)
- Relatório de importação com erros/warnings

### RF-11: Gestão de Utilizadores e Permissões

- CRUD de utilizadores (sincronização LDAP)
- CRUD de papéis (Spatie Permission)
- Atribuição de permissões a papéis
- Atribuição de papéis a utilizadores
- Seguir exactamente o padrão do CDMS Supplier

## 6. Requisitos Não-Funcionais

- **Performance:** Listar avaliações com paginação server-side (DataTable lazy loading)
- **Segurança:** RBAC rigoroso — trabalhador só vê as suas avaliações, avaliador só vê subordinados, chefe só vê departamento
- **Auditoria:** Cada acção registada com utilizador, data/hora, IP (Spatie Activity Log)
- **Confidencialidade:** Art. 22.º do regulamento — dados de avaliação são confidenciais
- **Responsividade:** Funcional em desktop e tablet (mobile secundário)
- **Disponibilidade:** Mesma infraestrutura do CDMS Supplier
