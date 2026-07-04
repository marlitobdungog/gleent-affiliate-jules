<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePayoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'partner_id' => 'required|exists:partners,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'nullable|string|max:255',
            'payment_reference' => 'nullable|string|max:255',
            'status' => 'required|in:draft,pending,processing,paid,failed,cancelled,on_hold',
            'period_start' => 'nullable|date',
            'period_end' => 'nullable|date',
        ];
    }
}
