<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'default_partner_link_domain' => 'sometimes|required|url',
            'default_commission_type' => 'sometimes|required|in:percentage,fixed',
            'default_commission_rate' => 'sometimes|required|numeric|min:0',
            'minimum_payout_amount' => 'sometimes|required|numeric|min:0',
            'affiliate_program_status' => 'sometimes|required|in:active,inactive',
        ];
    }
}
