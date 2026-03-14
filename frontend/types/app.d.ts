// Permission
export interface IPermission {
    id: number;
    name: string;
    guard_name?: string;
}

// Role
export interface IRole {
    id: number;
    name: string;
    guard_name?: string;
    permissions?: IPermission[];
    users_count?: number;
}

// User
export interface IUser {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    ldap_guid?: string;
    roles?: IRole[];
    permissions?: string[];
    permission?: string[];  // API também pode retornar como 'permission'
    trabalhador?: ITrabalhador;
    created_at?: string;
    updated_at?: string;
}

// Login Response
export interface ILogin {
    token: string;
    user: IUser;
}

// Ciclo de Avaliação
export interface ICicloAvaliacao {
    id: number;
    ano: number;
    nome: string;
    descricao?: string;
    data_inicio_autoavaliacao: string | null;
    data_fim_autoavaliacao: string | null;
    data_inicio_avaliacao: string | null;
    data_fim_avaliacao: string | null;
    data_inicio_revisao: string | null;
    data_fim_revisao: string | null;
    estado: 'planeado' | 'autoavaliacao' | 'avaliacao' | 'revisao' | 'concluido';
    criado_por: number;
    created_at?: string;
    updated_at?: string;
}

// Trabalhador
export interface ITrabalhador {
    id: number;
    user_id?: number;
    numero_funcionario: string;
    nome_completo: string;
    departamento: string;
    cargo: string;
    categoria: 'nao_lider' | 'supervisor' | 'chefe_seccao' | 'chefe_departamento' | 'director' | 'director_geral';
    data_admissao?: string;
    superior_directo_id?: number;
    is_lider: boolean;
    nivel_lideranca?: 'nao_lider' | 'supervisor' | 'chefe_seccao' | 'chefe_departamento' | 'director' | 'director_geral';
    user?: IUser;
    superior_directo?: ITrabalhador;
    subordinados?: ITrabalhador[];
    created_at?: string;
    updated_at?: string;
}

// Indicador
export interface IIndicador {
    id: number;
    codigo: string;
    nome: string;
    descricao?: string;
    ordem: number;
    activo: boolean;
    created_at?: string;
    updated_at?: string;
}

// Matriz de Pesos
export interface IMatrizPesos {
    id: number;
    categoria: string;
    indicador_id: number;
    peso: number;
    descricao_categoria?: string;
    indicador?: IIndicador;
}

// Item de Avaliação
export interface IItemAvaliacao {
    id: number;
    avaliacao_id: number;
    indicador_id: number;
    pontuacao_auto?: number | null;
    justificacao_auto?: string | null;
    pontuacao_avaliador?: number | null;
    justificacao_avaliador?: string | null;
    pontuacao_final?: number | null;
    peso_aplicado: number;
    pontuacao_ponderada?: number | null;
    indicador?: IIndicador;
}

// Avaliação
export interface IAvaliacao {
    id: number;
    ciclo_id: number;
    trabalhador_id: number;
    avaliador_id?: number | null;
    revisor_departamental_id?: number | null;
    revisor_rh_id?: number | null;
    estado: 'rascunho' | 'auto_submetida' | 'aval_rascunho' | 'aval_submetida' | 'rev_departamento' | 'rev_rh' | 'aprovada' | 'feedback_feito' | 'contestada';
    pontuacao_auto?: number | null;
    pontuacao_avaliador?: number | null;
    pontuacao_final?: number | null;
    classificacao_final?: string | null;
    data_submissao_auto?: string | null;
    data_submissao_avaliador?: string | null;
    data_revisao_departamental?: string | null;
    data_revisao_rh?: string | null;
    data_feedback?: string | null;
    observacoes_trabalhador?: string | null;
    observacoes_avaliador?: string | null;
    observacoes_revisor?: string | null;
    observacoes_rh?: string | null;
    ciclo?: ICicloAvaliacao;
    trabalhador?: ITrabalhador;
    avaliador?: IUser;
    revisor_departamental?: IUser;
    revisor_rh?: IUser;
    itens?: IItemAvaliacao[];
    contestacoes?: IContestacao[];
    planos_melhoria?: IPlanoMelhoria[];
    registos_one_on_one?: IRegistoOneOnOne[];
    created_at?: string;
    updated_at?: string;
}

// Contestação
export interface IContestacao {
    id: number;
    avaliacao_id: number;
    motivo: string;
    descricao: string;
    estado: 'pendente' | 'em_analise' | 'aceite' | 'rejeitada';
    resposta?: string | null;
    respondido_por?: number | null;
    data_resposta?: string | null;
    avaliacao?: IAvaliacao;
    respondido_por_user?: IUser;
    created_at?: string;
    updated_at?: string;
}

// Registo One-on-One
export interface IRegistoOneOnOne {
    id: number;
    avaliacao_id: number;
    criado_por: number;
    data_reuniao: string;
    duracao_minutos?: number | null;
    topicos_discutidos?: string | null;
    accoes_acordadas?: string | null;
    notas_privadas?: string | null;
    avaliacao?: IAvaliacao;
    criado_por_user?: IUser;
    created_at?: string;
    updated_at?: string;
}

// Plano de Melhoria
export interface IPlanoMelhoria {
    id: number;
    avaliacao_id: number;
    area_melhoria: string;
    objectivo: string;
    accoes: string;
    recursos_necessarios?: string | null;
    prazo?: string | null;
    estado: 'planeado' | 'em_curso' | 'concluido' | 'cancelado';
    progresso: number;
    notas_acompanhamento?: string | null;
    avaliacao?: IAvaliacao;
    created_at?: string;
    updated_at?: string;
}

// Notification
export interface INotification {
    id: string;
    type: string;
    notifiable_type: string;
    notifiable_id: number;
    data: {
        titulo?: string;
        mensagem?: string;
        tipo?: string;
        link?: string;
        [key: string]: any;
    };
    read_at?: string | null;
    created_at: string;
    updated_at?: string;
}

// Dashboard Data Types
export interface IDashboardTrabalhador {
    avaliacao_actual?: IAvaliacao;
    ciclo_activo?: ICicloAvaliacao;
    historico: IAvaliacao[];
    estatisticas: {
        media_historica: number;
        total_avaliacoes: number;
    };
}

export interface IDashboardAvaliador {
    equipa: IAvaliacao[];
    pendentes: number;
    concluidas: number;
    media_equipa: number;
}

export interface IDashboardDepartamento {
    avaliacoes: IAvaliacao[];
    pendentes_revisao: number;
    estatisticas: {
        total: number;
        media: number;
        por_estado: Record<string, number>;
    };
}

export interface IDashboardRH {
    ciclo_activo?: ICicloAvaliacao;
    estatisticas: {
        total_avaliacoes: number;
        concluidas: number;
        em_progresso: number;
        media_geral: number;
        por_departamento: Array<{
            departamento: string;
            total: number;
            media: number;
        }>;
        por_classificacao: Record<string, number>;
    };
}

export interface IDashboardAdmin {
    usuarios: {
        total: number;
        activos: number;
        inactivos: number;
    };
    ciclos: {
        total: number;
        activo: ICicloAvaliacao | null;
    };
    logs_recentes: number;
}

// API Response Types
export interface IApiResponse<T> {
    data: T;
    message?: string;
    success?: boolean;
}

export interface IPaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
    links?: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
}
