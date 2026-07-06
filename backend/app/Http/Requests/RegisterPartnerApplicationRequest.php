<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterPartnerApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('partners', 'email'),
                Rule::unique('users', 'email'),
                Rule::unique('applications', 'email')->where(function ($query) {
                    $query->whereIn('status', ['submitted', 'under_review', 'needs_more_info']);
                }),
            ],
            'phone' => 'nullable|string|max:20',
            'company_name' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'social_link' => 'nullable|url|max:255',
            'promotion_plan' => 'nullable|string',
            'audience_description' => 'nullable|string',
        ];
    }
}
