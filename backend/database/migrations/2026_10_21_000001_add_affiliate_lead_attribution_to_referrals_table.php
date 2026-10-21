<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('referrals', function (Blueprint $table) {
            $table->uuid('affiliate_click_id')->nullable()->after('product_id')->index();
            $table->char('lead_identity_hash', 64)->nullable()->unique();
            $table->string('external_source_key', 150)->nullable()->unique();
            $table->string('signup_status', 40)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('referrals', function (Blueprint $table) {
            $table->dropUnique(['lead_identity_hash']);
            $table->dropUnique(['external_source_key']);
            $table->dropIndex(['affiliate_click_id']);
            $table->dropColumn(['affiliate_click_id', 'lead_identity_hash', 'external_source_key', 'signup_status']);
        });
    }
};
