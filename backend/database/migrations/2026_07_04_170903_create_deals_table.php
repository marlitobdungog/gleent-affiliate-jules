<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referral_id')->constrained('referrals');
            $table->foreignId('partner_id')->constrained('partners');
            $table->foreignId('product_id')->constrained('products');
            $table->string('client_name');
            $table->string('deal_name');
            $table->decimal('deal_value', 15, 2);
            $table->string('status')->default('open'); // open, won, lost, cancelled
            $table->timestamp('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deals');
    }
};
