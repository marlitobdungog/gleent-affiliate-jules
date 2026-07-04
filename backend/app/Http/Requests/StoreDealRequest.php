<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDealRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'referral_id' => 'required|exists:referrals,id',
            'partner_id' => 'required|exists:partners,id',
            'product_id' => 'required|exists:products,id',
            'client_name' => 'required|string|max:255',
            'deal_name' => 'required|string|max:255',
            'deal_value' => 'required|numeric|min:0',
            'status' => 'required|in:open,won,lost,cancelled',
            'closed_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ];
    }
}
