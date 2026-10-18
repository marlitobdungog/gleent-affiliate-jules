<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductAffiliateLink extends Model
{
    protected $fillable = [
        'partner_id',
        'product_id',
        'landing_page_id',
        'token',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function landingPage(): BelongsTo
    {
        return $this->belongsTo(ProductLandingPage::class, 'landing_page_id');
    }

    public function clicks(): HasMany
    {
        return $this->hasMany(ProductAffiliateLinkClick::class, 'affiliate_link_id');
    }
}
