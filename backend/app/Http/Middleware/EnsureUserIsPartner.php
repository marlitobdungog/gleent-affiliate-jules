<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
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

        $request->attributes->set('partner', $partner);

        return $next($request);
    }
}
