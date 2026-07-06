<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PartnerStoreReferralRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => 'required|exists:products,id',
            'lead_name' => 'required|string|max:255',
            'lead_email' => 'required|email|max:255',
            'company_name' => 'required|string|max:255',
            'notes' => 'nullable|string',
        ];
    }
}
