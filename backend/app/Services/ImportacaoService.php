<?php

namespace App\Services;

use App\Models\Trabalhador;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ImportacaoService
{
    /**
     * Importar trabalhadores a partir de array de dados
     */
    public function importarTrabalhadores(array $dados, bool $criarUsers = false): array
    {
        $resultados = [
            'sucesso' => 0,
            'erros' => 0,
            'actualizados' => 0,
            'detalhes' => [],
        ];

        DB::beginTransaction();

        try {
            foreach ($dados as $index => $linha) {
                try {
                    $resultado = $this->processarLinhaTrabalhador($linha, $criarUsers);

                    if ($resultado['tipo'] === 'criado') {
                        $resultados['sucesso']++;
                    } elseif ($resultado['tipo'] === 'actualizado') {
                        $resultados['actualizados']++;
                    }

                    $resultados['detalhes'][] = [
                        'linha' => $index + 1,
                        'status' => 'ok',
                        'tipo' => $resultado['tipo'],
                        'numero_funcionario' => $linha['numero_funcionario'] ?? '',
                    ];
                } catch (\Exception $e) {
                    $resultados['erros']++;
                    $resultados['detalhes'][] = [
                        'linha' => $index + 1,
                        'status' => 'erro',
                        'mensagem' => $e->getMessage(),
                        'numero_funcionario' => $linha['numero_funcionario'] ?? '',
                    ];
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erro na importação de trabalhadores: ' . $e->getMessage());
            throw $e;
        }

        return $resultados;
    }

    /**
     * Processar uma linha de dados de trabalhador
     */
    protected function processarLinhaTrabalhador(array $dados, bool $criarUser): array
    {
        // Validar dados obrigatórios
        $this->validarDadosTrabalhador($dados);

        // Verificar se já existe
        $trabalhadorExistente = Trabalhador::where('numero_funcionario', $dados['numero_funcionario'])->first();

        if ($trabalhadorExistente) {
            // Actualizar
            $trabalhadorExistente->update($this->prepararDadosTrabalhador($dados));
            return ['tipo' => 'actualizado', 'trabalhador' => $trabalhadorExistente];
        }

        // Criar novo
        $dadosTrabalhador = $this->prepararDadosTrabalhador($dados);

        // Criar utilizador se solicitado
        if ($criarUser && isset($dados['email'])) {
            $user = $this->criarOuObterUser($dados);
            $dadosTrabalhador['user_id'] = $user->id;
        }

        // Resolver superior directo se fornecido
        if (isset($dados['superior_numero_funcionario'])) {
            $superior = Trabalhador::where('numero_funcionario', $dados['superior_numero_funcionario'])->first();
            if ($superior) {
                $dadosTrabalhador['superior_directo_id'] = $superior->id;
            }
        }

        $trabalhador = Trabalhador::create($dadosTrabalhador);

        return ['tipo' => 'criado', 'trabalhador' => $trabalhador];
    }

    /**
     * Validar dados obrigatórios do trabalhador
     */
    protected function validarDadosTrabalhador(array $dados): void
    {
        $camposObrigatorios = ['numero_funcionario', 'nome_completo', 'departamento', 'cargo', 'categoria'];

        foreach ($camposObrigatorios as $campo) {
            if (empty($dados[$campo])) {
                throw new \Exception("Campo obrigatório em falta: {$campo}");
            }
        }

        // Validar categoria
        $categoriasValidas = [
            'nao_lider', 'supervisor', 'chefe_seccao',
            'chefe_departamento', 'director', 'director_geral'
        ];

        if (!in_array($dados['categoria'], $categoriasValidas)) {
            throw new \Exception("Categoria inválida: {$dados['categoria']}");
        }
    }

    /**
     * Preparar dados para criar/actualizar trabalhador
     */
    protected function prepararDadosTrabalhador(array $dados): array
    {
        $isLider = in_array($dados['categoria'], [
            'supervisor', 'chefe_seccao', 'chefe_departamento', 'director', 'director_geral'
        ]);

        return [
            'numero_funcionario' => $dados['numero_funcionario'],
            'nome_completo' => $dados['nome_completo'],
            'departamento' => $dados['departamento'],
            'cargo' => $dados['cargo'],
            'categoria' => $dados['categoria'],
            'data_admissao' => $dados['data_admissao'] ?? null,
            'is_lider' => $isLider,
            'nivel_lideranca' => $dados['categoria'],
        ];
    }

    /**
     * Criar ou obter utilizador existente
     */
    protected function criarOuObterUser(array $dados): User
    {
        $email = strtolower($dados['email']);

        $user = User::where('email', $email)->first();

        if ($user) {
            return $user;
        }

        // Criar novo utilizador
        $user = User::create([
            'name' => $dados['nome_completo'],
            'email' => $email,
            'password' => Hash::make(Str::random(12)), // Password temporária
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // Atribuir role baseado na categoria
        $role = $this->determinarRolePorCategoria($dados['categoria']);
        $user->assignRole($role);

        return $user;
    }

    /**
     * Determinar role baseado na categoria do trabalhador
     */
    protected function determinarRolePorCategoria(string $categoria): string
    {
        return match ($categoria) {
            'director_geral', 'director' => 'chefe-departamento',
            'chefe_departamento' => 'chefe-departamento',
            'chefe_seccao', 'supervisor' => 'avaliador',
            default => 'trabalhador',
        };
    }

    /**
     * Importar hierarquia (superiores directos)
     */
    public function importarHierarquia(array $dados): array
    {
        $resultados = [
            'sucesso' => 0,
            'erros' => 0,
            'detalhes' => [],
        ];

        foreach ($dados as $linha) {
            try {
                if (empty($linha['numero_funcionario']) || empty($linha['superior_numero_funcionario'])) {
                    continue;
                }

                $trabalhador = Trabalhador::where('numero_funcionario', $linha['numero_funcionario'])->first();
                $superior = Trabalhador::where('numero_funcionario', $linha['superior_numero_funcionario'])->first();

                if (!$trabalhador) {
                    throw new \Exception("Trabalhador não encontrado: {$linha['numero_funcionario']}");
                }

                if (!$superior) {
                    throw new \Exception("Superior não encontrado: {$linha['superior_numero_funcionario']}");
                }

                if ($trabalhador->id === $superior->id) {
                    throw new \Exception("Trabalhador não pode ser seu próprio superior");
                }

                $trabalhador->update(['superior_directo_id' => $superior->id]);
                $resultados['sucesso']++;

                $resultados['detalhes'][] = [
                    'numero_funcionario' => $linha['numero_funcionario'],
                    'superior' => $linha['superior_numero_funcionario'],
                    'status' => 'ok',
                ];
            } catch (\Exception $e) {
                $resultados['erros']++;
                $resultados['detalhes'][] = [
                    'numero_funcionario' => $linha['numero_funcionario'] ?? '',
                    'status' => 'erro',
                    'mensagem' => $e->getMessage(),
                ];
            }
        }

        return $resultados;
    }

    /**
     * Validar ficheiro de importação
     */
    public function validarFicheiro(array $dados): array
    {
        $erros = [];
        $avisos = [];

        $numerosFuncionario = [];

        foreach ($dados as $index => $linha) {
            $linhaNum = $index + 1;

            // Verificar campos obrigatórios
            foreach (['numero_funcionario', 'nome_completo', 'departamento', 'cargo', 'categoria'] as $campo) {
                if (empty($linha[$campo])) {
                    $erros[] = "Linha {$linhaNum}: Campo '{$campo}' em falta";
                }
            }

            // Verificar duplicados
            if (!empty($linha['numero_funcionario'])) {
                if (in_array($linha['numero_funcionario'], $numerosFuncionario)) {
                    $erros[] = "Linha {$linhaNum}: Número de funcionário duplicado: {$linha['numero_funcionario']}";
                }
                $numerosFuncionario[] = $linha['numero_funcionario'];
            }

            // Verificar categoria válida
            if (!empty($linha['categoria'])) {
                $categoriasValidas = ['nao_lider', 'supervisor', 'chefe_seccao', 'chefe_departamento', 'director', 'director_geral'];
                if (!in_array($linha['categoria'], $categoriasValidas)) {
                    $erros[] = "Linha {$linhaNum}: Categoria inválida: {$linha['categoria']}";
                }
            }

            // Verificar formato de email
            if (!empty($linha['email']) && !filter_var($linha['email'], FILTER_VALIDATE_EMAIL)) {
                $avisos[] = "Linha {$linhaNum}: Email inválido: {$linha['email']}";
            }

            // Verificar formato de data
            if (!empty($linha['data_admissao'])) {
                $data = \DateTime::createFromFormat('Y-m-d', $linha['data_admissao']);
                if (!$data) {
                    $avisos[] = "Linha {$linhaNum}: Formato de data inválido (esperado: YYYY-MM-DD)";
                }
            }
        }

        return [
            'valido' => empty($erros),
            'erros' => $erros,
            'avisos' => $avisos,
            'total_linhas' => count($dados),
        ];
    }

    /**
     * Gerar template de importação
     */
    public function gerarTemplate(): array
    {
        return [
            'colunas' => [
                'numero_funcionario' => 'Número único do funcionário (obrigatório)',
                'nome_completo' => 'Nome completo do trabalhador (obrigatório)',
                'departamento' => 'Nome do departamento (obrigatório)',
                'cargo' => 'Cargo/função (obrigatório)',
                'categoria' => 'nao_lider|supervisor|chefe_seccao|chefe_departamento|director|director_geral (obrigatório)',
                'data_admissao' => 'Data de admissão formato YYYY-MM-DD (opcional)',
                'email' => 'Email do trabalhador (opcional, necessário se criar utilizadores)',
                'superior_numero_funcionario' => 'Número de funcionário do superior directo (opcional)',
            ],
            'exemplo' => [
                [
                    'numero_funcionario' => 'COR001',
                    'nome_completo' => 'João Silva',
                    'departamento' => 'Operações',
                    'cargo' => 'Chefe de Departamento',
                    'categoria' => 'chefe_departamento',
                    'data_admissao' => '2015-03-15',
                    'email' => 'joao.silva@cornelder.co.mz',
                    'superior_numero_funcionario' => '',
                ],
                [
                    'numero_funcionario' => 'COR002',
                    'nome_completo' => 'Maria Santos',
                    'departamento' => 'Operações',
                    'cargo' => 'Supervisora',
                    'categoria' => 'supervisor',
                    'data_admissao' => '2018-06-01',
                    'email' => 'maria.santos@cornelder.co.mz',
                    'superior_numero_funcionario' => 'COR001',
                ],
            ],
        ];
    }
}
