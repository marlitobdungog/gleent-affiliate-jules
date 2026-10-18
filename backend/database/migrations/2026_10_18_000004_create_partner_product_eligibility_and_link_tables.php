<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_product_eligibilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('granted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['partner_id', 'product_id']);
            $table->index(['product_id', 'is_active']);
        });

        Schema::create('product_affiliate_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->restrictOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('landing_page_id')->constrained('product_landing_pages')->restrictOnDelete();
            $table->string('token', 64)->unique();
            $table->timestamps();
            $table->unique(['partner_id', 'product_id', 'landing_page_id'], 'product_affiliate_links_unique_target');
            $table->index(['product_id', 'landing_page_id']);
        });

        Schema::create('product_affiliate_link_clicks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('affiliate_link_id')->constrained('product_affiliate_links')->restrictOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['affiliate_link_id', 'created_at']);
        });

        // Existing approved applications are the only reliable in-app source of partner/product eligibility.
        // Existing records without a matching approved application keep their legacy link until an admin assigns a product.
        $approvedPairs = DB::table('applications')
            ->join('partners', 'partners.email', '=', 'applications.email')
            ->where('applications.status', 'approved')
            ->whereNull('applications.deleted_at')
            ->select('partners.id as partner_id', 'applications.target_product_id as product_id')
            ->distinct()
            ->get();

        foreach ($approvedPairs as $pair) {
            DB::table('partner_product_eligibilities')->insertOrIgnore([
                'partner_id' => $pair->partner_id,
                'product_id' => $pair->product_id,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_affiliate_link_clicks');
        Schema::dropIfExists('product_affiliate_links');
        Schema::dropIfExists('partner_product_eligibilities');
    }
};
