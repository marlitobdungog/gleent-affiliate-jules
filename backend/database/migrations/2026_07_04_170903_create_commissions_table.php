<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners');
            $table->foreignId('deal_id')->constrained('deals');
            $table->foreignId('product_id')->constrained('products');
            $table->decimal('base_amount', 15, 2);
            $table->string('commission_type'); // percentage, fixed
            $table->decimal('commission_rate', 10, 2);
            $table->decimal('commission_amount', 15, 2);
            $table->string('status')->default('pending_approval'); // pending_approval, approved, for_payout, paid, rejected, cancelled
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commissions');
    }
};
