<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'company_name' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'social_link' => 'nullable|url|max:255',
            'target_product_id' => 'required|exists:products,id',
            'promotion_plan' => 'nullable|string',
            'audience_description' => 'nullable|string',
            'status' => 'sometimes|required|in:submitted,under_review,approved,rejected,needs_more_info',
        ];
    }
}
