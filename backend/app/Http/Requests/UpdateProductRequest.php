<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:255|unique:products,slug,' . $this->route('product'),
            'description' => 'nullable|string',
            'status' => 'sometimes|required|in:active,inactive',
            'default_commission_type' => 'sometimes|required|in:percentage,fixed',
            'default_commission_rate' => 'sometimes|required|numeric|min:0',
        ];
    }
}
