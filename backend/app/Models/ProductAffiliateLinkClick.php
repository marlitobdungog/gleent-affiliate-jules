<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductAffiliateLinkClick extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'affiliate_link_id',
        'click_id',
    ];

    public function affiliateLink(): BelongsTo
    {
        return $this->belongsTo(ProductAffiliateLink::class, 'affiliate_link_id');
    }
}
