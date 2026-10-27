<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('referrals', function (Blueprint $table) {
            $table->unsignedInteger('crm_lead_id')->nullable()->unique();
            $table->unsignedInteger('crm_pipeline_id')->nullable();
            $table->string('crm_pipeline_name')->nullable();
            $table->unsignedInteger('crm_stage_id')->nullable();
            $table->string('crm_stage_code', 100)->nullable()->index();
            $table->string('crm_stage_name')->nullable();
            $table->unsignedInteger('crm_stage_sort_order')->nullable();
            $table->unsignedBigInteger('crm_stage_revision')->default(0);
            $table->timestamp('crm_stage_updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('referrals', function (Blueprint $table) {
            $table->dropUnique(['crm_lead_id']);
            $table->dropIndex(['crm_stage_code']);
            $table->dropColumn([
                'crm_lead_id',
                'crm_pipeline_id',
                'crm_pipeline_name',
                'crm_stage_id',
                'crm_stage_code',
                'crm_stage_name',
                'crm_stage_sort_order',
                'crm_stage_revision',
                'crm_stage_updated_at',
            ]);
        });
    }
};
