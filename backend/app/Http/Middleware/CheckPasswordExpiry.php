<?php

namespace App\Http\Middleware;

use Carbon\Carbon;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckPasswordExpiry
{
    /**
     * Número de dias até a password expirar
     */
    const PASSWORD_DAYS_TO_EXPIRE = 90;

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // Apenas verificar para utilizadores locais (sem LDAP)
        if ($user && $user->ldap_guid === null) {
            $passwordLastChanged = Carbon::parse($user->password_changed_at);
            $now = Carbon::now();

            if ($passwordLastChanged->diffInDays($now) >= self::PASSWORD_DAYS_TO_EXPIRE) {
                return response()->json([
                    'message' => 'A sua password expirou. Por favor actualize a sua password.'
                ], JsonResponse::HTTP_FOUND);
            }
        }

        return $next($request);
    }
}
