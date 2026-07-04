<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('company_name')->nullable();
            $table->string('website')->nullable();
            $table->string('social_link')->nullable();
            $table->foreignId('target_product_id')->constrained('products');
            $table->text('promotion_plan')->nullable();
            $table->text('audience_description')->nullable();
            $table->string('status')->default('submitted'); // submitted, under_review, approved, rejected, needs_more_info
            $table->text('review_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
