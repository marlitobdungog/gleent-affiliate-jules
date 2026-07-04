<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDealRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'deal_name' => 'sometimes|required|string|max:255',
            'deal_value' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|in:open,won,lost,cancelled',
            'closed_at' => 'nullable|date',
        ];
    }
}
