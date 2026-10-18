<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductLandingPage extends Model
{
    protected $fillable = [
        'product_id',
        'name',
        'destination_url',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function affiliateLinks(): HasMany
    {
        return $this->hasMany(ProductAffiliateLink::class, 'landing_page_id');
    }
}
