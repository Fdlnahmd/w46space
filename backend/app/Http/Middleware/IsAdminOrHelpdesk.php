<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsAdminOrHelpdesk
{
    /**
     * Mengizinkan user dengan role 'admin' atau 'helpdesk'.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !in_array(strtolower($user->role), ['admin', 'helpdesk'])) {
            return response()->json([
                'message' => 'Akses ditolak. Hanya admin atau helpdesk yang diizinkan.'
            ], 403);
        }

        return $next($request);
    }
}
