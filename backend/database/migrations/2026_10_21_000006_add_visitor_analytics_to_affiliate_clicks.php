<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_affiliate_link_clicks', function (Blueprint $table) {
            // Existing events predate visitor IDs and bot filtering, so their classification remains unknown.
            $table->char('visitor_key_hash', 64)->nullable();
            $table->boolean('is_countable')->nullable();
            $table->string('exclusion_reason', 32)->nullable();
            $table->index(
                ['affiliate_link_id', 'is_countable', 'created_at'],
                'affiliate_click_analytics_lookup_index',
            );
        });

        $now = now()->utc();
        DB::table('settings')->insertOrIgnore([
            'key' => 'affiliate_click_analytics_started_at',
            'value' => $now->toIso8601String(),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'affiliate_click_analytics_started_at')->delete();

        Schema::table('product_affiliate_link_clicks', function (Blueprint $table) {
            $table->dropIndex('affiliate_click_analytics_lookup_index');
            $table->dropColumn(['visitor_key_hash', 'is_countable', 'exclusion_reason']);
        });
    }
};
