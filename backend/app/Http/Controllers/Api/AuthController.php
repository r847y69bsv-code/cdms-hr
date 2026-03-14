<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Login do utilizador
     */
    public function login(Request $request)
    {
        $loginUserData = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|min:8'
        ]);

        // Tentar login pela database
        if (Auth::guard('web')->attempt($loginUserData)) {
            $user = User::where('email', strtolower($loginUserData['email']))->first();

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
            'message' => 'Utilizador/Password incorrectos'
        ], 401);
    }

    /**
     * Registo de novo utilizador
     */
    public function register(Request $request)
    {
        $registerUserData = $request->validate([
            'name' => 'required|string',
            'email' => 'required|string|email|unique:users',
            'password' => 'required|min:8|confirmed'
        ]);

        $user = User::create([
            'name' => $registerUserData['name'],
            'email' => strtolower($registerUserData['email']),
            'password' => Hash::make($registerUserData['password']),
            'password_changed_at' => Carbon::now(),
        ]);

        // Atribuir role de trabalhador por defeito
        $user->assignRole('trabalhador');

        $token = $user->createToken($user->name . '-AuthToken')->plainTextToken;

        return response()->json([
            'user' => $user,
            'access_token' => $token,
        ], 201);
    }

    /**
     * Actualizar password
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'old_password' => 'required',
            'new_password' => 'required|confirmed|min:8',
        ]);

        // Verificar password antiga
        if (!Hash::check($request->old_password, auth()->user()->password)) {
            return response()->json([
                'message' => 'A password antiga não corresponde!'
            ], 400);
        }

        // Actualizar password
        User::whereId(auth()->user()->id)->update([
            'password' => Hash::make($request->new_password),
            'password_changed_at' => Carbon::now()
        ]);

        return response()->json([
            'message' => 'Password actualizada com sucesso.',
            'data' => auth()->user()
        ]);
    }

    /**
     * Logout do utilizador
     */
    public function logout()
    {
        auth()->user()->tokens()->delete();

        return response()->json([
            'message' => 'Sessão terminada com sucesso'
        ], 200);
    }

    /**
     * Obter dados do utilizador autenticado
     */
    public function me(Request $request)
    {
        $user = $request->user();

        $userData = $user->toArray();
        $userData['roles'] = $user->roles->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
            ];
        });
        $userData['permission'] = $user->getAllPermissions()->pluck('name');

        return response()->json([
            'user' => $userData
        ]);
    }
}
