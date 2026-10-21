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
