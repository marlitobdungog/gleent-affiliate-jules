<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterPartnerApplicationRequest;
use App\Models\User;
use App\Services\ApplicationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'admin',
        ]);

        Auth::login($user);

        return response()->json([
            'user' => $user,
        ]);
    }

    public function login(Request $request)
    {
        return $this->authenticate($request, fn (User $user) => $user->isAdmin());
    }

    public function registerPartner(RegisterPartnerApplicationRequest $request, ApplicationService $applicationService)
    {
        $application = $applicationService->submit($request->validated());

        return response()->json([
            'message' => 'Application submitted successfully. You will receive access once approved.',
            'application' => $application->load('targetProduct'),
        ], 201);
    }

    public function loginPartner(Request $request)
    {
        return $this->authenticate($request, fn (User $user) => $user->isPartner());
    }

    private function authenticate(Request $request, callable $roleCheck)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (! Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials'],
            ]);
        }

        $user = Auth::user();

        if (! $roleCheck($user)) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            throw ValidationException::withMessages([
                'email' => ['Access denied.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json([
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if ($user->isPartner()) {
            $user->load('partner');
        }

        return response()->json($user);
    }
}
