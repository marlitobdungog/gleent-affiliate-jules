<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class PartnerActivationController extends Controller
{
    public function __invoke(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user?->isPartner()) {
            return response()->json([
                'message' => 'This activation link is invalid or has expired.',
            ], 422);
        }

        $status = Password::reset(
            $request->only('email', 'token', 'password', 'password_confirmation'),
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => null,
                ])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'This activation link is invalid or has expired.',
            ], 422);
        }

        return response()->json([
            'message' => 'Password set successfully. You can now log in.',
        ]);
    }
}
