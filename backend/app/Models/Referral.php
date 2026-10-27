<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Referral extends Model
{
    use HasFactory, SoftDeletes;

    protected $casts = [
        'crm_stage_revision' => 'integer',
        'crm_stage_sort_order' => 'integer',
        'crm_stage_updated_at' => 'datetime',
    ];

    protected $fillable = [
        'partner_id',
        'product_id',
        'affiliate_click_id',
        'lead_identity_hash',
        'external_source_key',
        'signup_status',
        'lead_name',
        'lead_email',
        'lead_phone',
        'company_name',
        'source',
        'status',
        'notes',
        'crm_lead_id',
        'crm_pipeline_id',
        'crm_pipeline_name',
        'crm_stage_id',
        'crm_stage_code',
        'crm_stage_name',
        'crm_stage_sort_order',
        'crm_stage_revision',
        'crm_stage_updated_at',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function affiliateClick(): BelongsTo
    {
        return $this->belongsTo(ProductAffiliateLinkClick::class, 'affiliate_click_id', 'click_id');
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }
}
