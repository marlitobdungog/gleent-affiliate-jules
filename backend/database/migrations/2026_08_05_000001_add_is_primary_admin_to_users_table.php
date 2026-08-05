<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'is_primary_admin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_primary_admin')->default(false)->after('role');
            });
        }

        $primaryAdminEmail = env('PRIMARY_ADMIN_EMAIL');

        if ($primaryAdminEmail) {
            $updatedAdmins = User::where('role', 'admin')
                ->where('email', $primaryAdminEmail)
                ->update(['is_primary_admin' => true]);

            if ($updatedAdmins !== 1) {
                throw new RuntimeException('PRIMARY_ADMIN_EMAIL must match exactly one existing admin user.');
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('users', 'is_primary_admin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_primary_admin');
            });
        }
    }
};
