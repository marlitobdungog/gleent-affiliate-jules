<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'status' => 'required|in:active,inactive',
            'default_commission_type' => 'required|in:percentage,fixed',
            'default_commission_rate' => 'required|numeric|min:0',
        ];
    }
}
