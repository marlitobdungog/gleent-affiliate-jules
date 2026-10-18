<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'website_url',
        'status',
        'default_commission_type',
        'default_commission_rate',
    ];

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class, 'target_product_id');
    }

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

    public function marketingAssets(): BelongsToMany
    {
        return $this->belongsToMany(MarketingAsset::class);
    }

    public function affiliateSettings(): HasOne
    {
        return $this->hasOne(ProductAffiliateSetting::class);
    }

    public function landingPages(): HasMany
    {
        return $this->hasMany(ProductLandingPage::class);
    }

    public function configurationAudits(): HasMany
    {
        return $this->hasMany(ProductConfigurationAudit::class);
    }
}
