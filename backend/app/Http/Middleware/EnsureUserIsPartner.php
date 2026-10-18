<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsPartner
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isPartner()) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $partner = $user->partner;

        if (! $partner) {
            return response()->json(['message' => 'Partner profile not found.'], 404);
        }

        if (! in_array($partner->status, ['active', 'approved'], true)) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json(['message' => 'Affiliate partner access is not active.'], 401);
        }

        $request->attributes->set('partner', $partner);

        return $next($request);
    }
}
