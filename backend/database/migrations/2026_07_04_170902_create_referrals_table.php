<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners');
            $table->foreignId('product_id')->constrained('products');
            $table->string('lead_name');
            $table->string('lead_email');
            $table->string('lead_phone')->nullable();
            $table->string('company_name')->nullable();
            $table->string('source')->nullable();
            $table->string('status')->default('new'); // new, contacted, qualified, demo_scheduled, proposal_sent, closed_won, closed_lost, invalid, duplicate
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
