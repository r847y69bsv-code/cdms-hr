<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LdapUserController extends Controller
{
    /**
     * Listar utilizadores LDAP disponíveis
     */
    public function index()
    {
        // TODO: Implementar listagem de utilizadores LDAP
        return response()->json([
            'message' => 'Funcionalidade LDAP a ser implementada',
            'users' => []
        ]);
    }

    /**
     * Login via LDAP
     */
    public function ldapLogin(Request $request)
    {
        $loginUserData = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required'
        ]);

        $credentials = [
            'mail' => $loginUserData['email'],
            'password' => $loginUserData['password'],
        ];

        // Tentar autenticação LDAP
        if (Auth::guard('ldap')->attempt($credentials)) {
            $user = User::where('email', strtolower($loginUserData['email']))->first();

            if (!$user) {
                return response()->json([
                    'message' => 'Utilizador não encontrado na base de dados local.'
                ], 404);
            }

            // Verificar se o utilizador está activo
            if (!$user->is_active) {
                return response()->json([
                    'message' => 'A sua conta está inactiva. Por favor contacte o suporte.'
                ], 401);
            }

            $token = $user->createToken($user->name . '-AuthToken')->plainTextToken;

            $userData = $user->toArray();
            $userData['roles'] = $user->roles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                ];
            });
            $userData['permission'] = $user->getAllPermissions()->pluck('name');

            return response()->json([
                'user' => $userData,
                'access_token' => $token,
            ], 200);
        }

        return response()->json([
            'message' => 'Credenciais LDAP inválidas'
        ], 401);
    }
}
