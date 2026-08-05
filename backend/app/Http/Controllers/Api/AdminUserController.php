<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdminUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            User::where('role', 'admin')
                ->orderByDesc('is_primary_admin')
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => $this->serializeAdminUser($user))
                ->values()
        );
    }

    public function store(StoreAdminUserRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => $request->validated('password'),
            'role' => 'admin',
        ]);

        return response()->json($this->serializeAdminUser($user), 201);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if (! $user->isAdmin()) {
            return response()->json([
                'message' => 'Only administrator accounts can be deleted here.',
            ], 404);
        }

        if ($user->isPrimaryAdmin()) {
            return response()->json([
                'message' => 'The primary administrator account cannot be deleted.',
            ], 403);
        }

        if ($request->user()?->is($user)) {
            return response()->json([
                'message' => 'You cannot delete your own administrator account.',
            ], 403);
        }

        $user->delete();

        return response()->json(null, 204);
    }

    private function serializeAdminUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_primary_admin' => $user->isPrimaryAdmin(),
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }
}
