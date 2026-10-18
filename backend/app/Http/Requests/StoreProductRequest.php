<?php

namespace App\Http\Requests;

use App\Rules\SecureHttpsUrl;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:products,slug',
            'description' => 'nullable|string',
            'website_url' => ['nullable', 'string', 'max:2048', new SecureHttpsUrl],
            'status' => 'required|in:active,inactive',
            'default_commission_type' => 'required|in:percentage,fixed',
            'default_commission_rate' => [
                'required', 'numeric', 'min:0',
                Rule::when($this->input('default_commission_type') === 'percentage', ['max:100']),
            ],
        ];
    }
}
