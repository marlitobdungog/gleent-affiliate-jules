<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePayoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|in:draft,pending,processing,paid,failed,cancelled,on_hold',
            'payment_reference' => 'nullable|string|max:255',
        ];
    }
}
