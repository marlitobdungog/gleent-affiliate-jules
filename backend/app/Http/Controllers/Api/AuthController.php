<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterPartnerApplicationRequest;
use App\Models\User;
use App\Services\ApplicationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        return $this->authenticate($request, fn (User $user) => $user->isAdmin());
    }

    public function bootstrapStatus()
    {
        return response()->json([
            'available' => ! User::where('role', 'admin')
                ->where('is_primary_admin', true)
                ->exists(),
        ]);
    }

    public function bootstrapAdmin(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $connection = DB::connection();
        $lockAcquired = true;

        if ($connection->getDriverName() === 'mysql') {
            $lockAcquired = (int) ($connection
                ->selectOne('SELECT GET_LOCK(?, 10) AS acquired', ['gleent-affiliate-admin-bootstrap'])
                ->acquired ?? 0) === 1;
        }

        if (! $lockAcquired) {
            return response()->json([
                'message' => 'Administrator setup is busy. Please try again.',
            ], 503);
        }

        try {
            $user = DB::transaction(function () use ($validated) {
                if (User::where('role', 'admin')->where('is_primary_admin', true)->exists()) {
                    return null;
                }

                $user = new User([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => $validated['password'],
                    'role' => 'admin',
                ]);
                $user->is_primary_admin = true;
                $user->save();

                return $user;
            });
        } finally {
            if ($connection->getDriverName() === 'mysql') {
                $connection->selectOne('SELECT RELEASE_LOCK(?) AS released', ['gleent-affiliate-admin-bootstrap']);
            }
        }

        if (! $user) {
            return response()->json([
                'message' => 'Administrator setup has already been completed.',
            ], 409);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'user' => $user,
        ], 201);
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

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($user->isPartner()) {
            $user->load('partner');
        }

        return response()->json($user);
    }
}
