<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePartnerProductEligibilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_ids' => ['present', 'array'],
            'product_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('products', 'id')
                    ->where('status', 'active')
                    ->whereNull('deleted_at'),
            ],
        ];
    }
}
