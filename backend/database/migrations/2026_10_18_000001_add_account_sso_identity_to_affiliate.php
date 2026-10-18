<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('account_user_id', 20)->nullable()->unique();
            $table->string('auth_service_user_id', 36)->nullable()->index();
            $table->string('auth_service_tenant_id', 36)->nullable();
            $table->string('password')->nullable()->change();
        });

        Schema::table('applications', function (Blueprint $table) {
            $table->string('account_user_id', 20)->nullable()->index();
            $table->string('auth_service_user_id', 36)->nullable();
            $table->string('auth_service_tenant_id', 36)->nullable();
        });

        // Existing partner password hashes are no longer valid credentials.
        DB::table('users')->where('role', 'partner')->update(['password' => null]);
    }

    public function down(): void
    {
        DB::table('users')->whereNull('password')->update([
            'password' => bcrypt(Str::random(64)),
        ]);

        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn(['account_user_id', 'auth_service_user_id', 'auth_service_tenant_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['account_user_id']);
            $table->dropIndex(['auth_service_user_id']);
            $table->dropColumn(['account_user_id', 'auth_service_user_id', 'auth_service_tenant_id']);
            $table->string('password')->nullable(false)->change();
        });
    }
};
