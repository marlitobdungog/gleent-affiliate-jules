<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('company_name')->nullable();
            $table->string('partner_code')->unique();
            $table->string('partner_link');
            $table->string('status')->default('pending'); // pending, approved, active, inactive, suspended, rejected
            $table->string('commission_type')->default('percentage'); // percentage, fixed
            $table->decimal('commission_rate', 10, 2);
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partners');
    }
};
