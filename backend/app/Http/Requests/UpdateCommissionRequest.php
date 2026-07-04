<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCommissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'sometimes|required|in:pending_approval,approved,for_payout,paid,rejected,cancelled',
            'commission_amount' => 'sometimes|required|numeric|min:0',
        ];
    }
}
