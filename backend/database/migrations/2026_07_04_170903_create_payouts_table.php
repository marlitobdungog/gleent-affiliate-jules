<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners');
            $table->decimal('amount', 15, 2);
            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable();
            $table->string('status')->default('draft'); // draft, pending, processing, paid, failed, cancelled, on_hold
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};
