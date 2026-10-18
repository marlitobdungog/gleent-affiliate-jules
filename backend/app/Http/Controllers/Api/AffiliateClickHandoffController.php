<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AffiliateClickHandoffService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AffiliateClickHandoffController extends Controller
{
    public function verify(Request $request, AffiliateClickHandoffService $service): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:2048'],
        ]);
        $verified = $service->verify($validated['token']);

        if (! $verified) {
            return response()->json(['message' => 'Invalid or expired attribution handoff.'], 404)
                ->header('Cache-Control', 'no-store');
        }

        return response()->json($verified)->header('Cache-Control', 'no-store');
    }
}
