<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Application extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'company_name',
        'website',
        'social_link',
        'target_product_id',
        'promotion_plan',
        'audience_description',
        'status',
        'review_notes',
        'account_user_id',
        'auth_service_user_id',
        'auth_service_tenant_id',
    ];

    protected $hidden = [
        'auth_service_user_id',
        'auth_service_tenant_id',
    ];

    public function targetProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'target_product_id');
    }
}
