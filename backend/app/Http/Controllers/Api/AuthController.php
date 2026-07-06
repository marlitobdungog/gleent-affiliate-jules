<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use App\Services\PartnerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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

    public function registerPartner(Request $request, PartnerService $partnerService)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users|unique:partners',
            'password' => 'required|string|min:8|confirmed',
            'company_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $defaultType = Setting::where('key', 'default_commission_type')->value('value') ?? 'percentage';
        $defaultRate = Setting::where('key', 'default_commission_rate')->value('value') ?? 10;

        $user = DB::transaction(function () use ($request, $partnerService, $defaultType, $defaultRate) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'partner',
            ]);

            $partnerService->createPartner([
                'user_id' => $user->id,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'company_name' => $request->company_name,
                'status' => 'pending',
                'commission_type' => $defaultType,
                'commission_rate' => $defaultRate,
                'joined_at' => now(),
            ]);

            return $user;
        });

        Auth::login($user);

        return response()->json([
            'user' => $user,
        ]);
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
