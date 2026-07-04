<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReferralRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lead_name' => 'sometimes|required|string|max:255',
            'lead_email' => 'sometimes|required|email|max:255',
            'status' => 'sometimes|required|in:new,contacted,qualified,demo_scheduled,proposal_sent,closed_won,closed_lost,invalid,duplicate',
        ];
    }
}
