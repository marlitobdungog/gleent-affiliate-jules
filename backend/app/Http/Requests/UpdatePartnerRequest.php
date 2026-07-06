<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePartnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $partner = $this->route('partner');

        return [
            'name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('partners', 'email')->ignore($partner?->id),
            ],
            'status' => 'sometimes|required|in:pending,approved,active,inactive,suspended,rejected',
            'commission_type' => 'sometimes|required|in:percentage,fixed',
            'commission_rate' => 'sometimes|required|numeric|min:0',
        ];
    }
}
