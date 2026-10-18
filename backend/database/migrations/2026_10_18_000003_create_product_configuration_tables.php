<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_affiliate_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('tracking_mode')->default('direct');
            $table->string('referral_parameter', 100)->default('ref');
            $table->unsignedSmallInteger('attribution_window_days')->nullable();
            $table->timestamps();
        });

        Schema::create('product_landing_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('destination_url', 2048);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['product_id', 'is_active', 'is_default']);
        });

        Schema::create('product_configuration_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('configuration_area', 50);
            $table->json('before_state')->nullable();
            $table->json('after_state')->nullable();
            $table->timestamps();
            $table->index(['product_id', 'created_at']);
        });

        DB::table('settings')->insertOrIgnore([
            'key' => 'default_attribution_window_days',
            'value' => '30',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('product_configuration_audits');
        Schema::dropIfExists('product_landing_pages');
        Schema::dropIfExists('product_affiliate_settings');
        DB::table('settings')->where('key', 'default_attribution_window_days')->where('value', '30')->delete();
    }
};
