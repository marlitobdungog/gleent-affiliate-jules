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
            // Approval provisions a partner and synchronizes auth-service access;
            // it must go through the explicit approve endpoint.
            'status' => 'sometimes|required|in:submitted,under_review,rejected,needs_more_info',
            'review_notes' => 'nullable|string',
        ];
    }
}
