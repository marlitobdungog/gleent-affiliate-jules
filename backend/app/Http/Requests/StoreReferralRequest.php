<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReferralRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'partner_id' => 'required|exists:partners,id',
            'product_id' => 'required|exists:products,id',
            'lead_name' => 'required|string|max:255',
            'lead_email' => 'required|email|max:255',
            'lead_phone' => 'nullable|string|max:20',
            'company_name' => 'nullable|string|max:255',
            'source' => 'nullable|string|max:255',
            'status' => 'sometimes|required|in:new,contacted,qualified,demo_scheduled,proposal_sent,closed_won,closed_lost,invalid,duplicate',
            'notes' => 'nullable|string',
        ];
    }
}
