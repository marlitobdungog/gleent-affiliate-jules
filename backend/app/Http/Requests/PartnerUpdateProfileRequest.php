<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PartnerUpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $partner = $this->attributes->get('partner');
        $userId = $partner?->user_id;

        return [
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
                Rule::unique('partners', 'email')->ignore($partner?->id),
            ],
            'company_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ];
    }
}
