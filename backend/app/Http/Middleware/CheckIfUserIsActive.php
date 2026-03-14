<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckIfUserIsActive
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user && $user->is_active == false) {
            auth()->user()->tokens()->delete();
            return response()->json([
                'message' => 'A sua conta está inactiva. Por favor contacte o suporte.'
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        return $next($request);
    }
}
