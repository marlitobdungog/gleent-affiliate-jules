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
        Schema::table('product_affiliate_links', function (Blueprint $table) {
            $table->string('short_code', 8)->nullable();
        });

        DB::table('product_affiliate_links')
            ->whereNull('short_code')
            ->orderBy('id')
            ->chunkById(250, function ($links): void {
                foreach ($links as $link) {
                    do {
                        $shortCode = $this->generateShortCode();
                    } while (DB::table('product_affiliate_links')->where('short_code', $shortCode)->exists());

                    DB::table('product_affiliate_links')
                        ->where('id', $link->id)
                        ->whereNull('short_code')
                        ->update(['short_code' => $shortCode]);
                }
            });

        Schema::table('product_affiliate_links', function (Blueprint $table) {
            $table->unique('short_code', 'product_affiliate_links_short_code_unique');
            $table->string('short_code', 8)->nullable(false)->change();
        });

        Schema::table('product_affiliate_link_clicks', function (Blueprint $table) {
            $table->uuid('click_id')->nullable();
        });

        DB::table('product_affiliate_link_clicks')
            ->whereNull('click_id')
            ->orderBy('id')
            ->chunkById(250, function ($clicks): void {
                foreach ($clicks as $click) {
                    DB::table('product_affiliate_link_clicks')
                        ->where('id', $click->id)
                        ->whereNull('click_id')
                        ->update(['click_id' => (string) Str::uuid()]);
                }
            });

        Schema::table('product_affiliate_link_clicks', function (Blueprint $table) {
            $table->unique('click_id', 'product_affiliate_link_clicks_click_id_unique');
            $table->uuid('click_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('product_affiliate_link_clicks', function (Blueprint $table) {
            $table->dropUnique('product_affiliate_link_clicks_click_id_unique');
            $table->dropColumn('click_id');
        });

        Schema::table('product_affiliate_links', function (Blueprint $table) {
            $table->dropUnique('product_affiliate_links_short_code_unique');
            $table->dropColumn('short_code');
        });
    }

    private function generateShortCode(): string
    {
        $alphabet = (string) config('services.affiliate.short_code_alphabet', 'abcdefghjkmnpqrstuvwxyz23456789');
        $length = (int) config('services.affiliate.short_code_length', 8);
        $alphabetLength = strlen($alphabet);
        $limit = intdiv(256, $alphabetLength) * $alphabetLength;
        $code = '';

        while (strlen($code) < $length) {
            foreach (str_split(random_bytes(max(16, $length))) as $byte) {
                $value = ord($byte);
                if ($value >= $limit) {
                    continue;
                }

                $code .= $alphabet[$value % $alphabetLength];
                if (strlen($code) === $length) {
                    break;
                }
            }
        }

        return $code;
    }
};
