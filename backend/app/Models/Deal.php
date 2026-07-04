<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Deal extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'referral_id',
        'partner_id',
        'product_id',
        'client_name',
        'deal_name',
        'deal_value',
        'status',
        'closed_at',
        'notes',
    ];

    protected $casts = [
        'closed_at' => 'datetime',
        'deal_value' => 'decimal:2',
    ];

    public function referral(): BelongsTo
    {
        return $this->belongsTo(Referral::class);
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function commission(): HasOne
    {
        return $this->hasOne(Commission::class);
    }
}
