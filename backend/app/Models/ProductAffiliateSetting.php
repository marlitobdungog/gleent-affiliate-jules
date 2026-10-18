<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductAffiliateSetting extends Model
{
    protected $fillable = [
        'product_id',
        'tracking_mode',
        'referral_parameter',
        'attribution_window_days',
    ];

    protected $casts = [
        'attribution_window_days' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
