<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_asset_product', function (Blueprint $table) {
            $table->foreignId('marketing_asset_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unique(['marketing_asset_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_asset_product');
    }
};
