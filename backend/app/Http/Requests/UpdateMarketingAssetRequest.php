<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMarketingAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', Rule::in(['Banner', 'Copy', 'Brochure', 'Social', 'Email'])],
            'file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx,zip', 'max:10240'],
            'is_active' => ['sometimes', 'required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'product_ids' => ['sometimes', 'nullable', 'array'],
            'product_ids.*' => ['integer', 'distinct', 'exists:products,id'],
        ];
    }
}
