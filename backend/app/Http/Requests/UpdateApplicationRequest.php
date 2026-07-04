<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255',
            'status' => 'sometimes|required|in:submitted,under_review,approved,rejected,needs_more_info',
            'review_notes' => 'nullable|string',
        ];
    }
}
