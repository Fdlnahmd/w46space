<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsAdmin
{
    /**
     * Hanya mengizinkan user dengan role 'admin'.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || strtolower($user->role) !== 'admin') {
            return response()->json([
                'message' => 'Akses ditolak. Hanya admin yang diizinkan.'
            ], 403);
        }

        return $next($request);
    }
}
