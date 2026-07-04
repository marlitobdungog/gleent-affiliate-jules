<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'partner_id' => 'required|exists:partners,id',
            'deal_id' => 'required|exists:deals,id',
            'product_id' => 'required|exists:products,id',
            'base_amount' => 'required|numeric|min:0',
            'commission_type' => 'required|in:percentage,fixed',
            'commission_rate' => 'required|numeric|min:0',
            'commission_amount' => 'required|numeric|min:0',
            'status' => 'required|in:pending_approval,approved,for_payout,paid,rejected,cancelled',
        ];
    }
}
