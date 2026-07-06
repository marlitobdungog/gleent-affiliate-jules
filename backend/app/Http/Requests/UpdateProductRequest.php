<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $product = $this->route('product');

        return [
            'name' => 'sometimes|required|string|max:255',
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->ignore($product?->id),
            ],
            'description' => 'nullable|string',
            'status' => 'sometimes|required|in:active,inactive',
            'default_commission_type' => 'sometimes|required|in:percentage,fixed',
            'default_commission_rate' => 'sometimes|required|numeric|min:0',
        ];
    }
}
