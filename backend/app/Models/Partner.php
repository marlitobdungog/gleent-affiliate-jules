<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Partner extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'company_name',
        'partner_code',
        'partner_link',
        'status',
        'commission_type',
        'commission_rate',
        'joined_at',
        'approved_at',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class);
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(Commission::class);
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class);
    }
}
