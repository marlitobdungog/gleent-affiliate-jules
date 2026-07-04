<?php

namespace App\Services;

use App\Models\Payout;
use App\Models\Commission;
use Illuminate\Support\Facades\DB;

class PayoutService
{
    public function markAsPaid(Payout $payout)
    {
        return DB::transaction(function () use ($payout) {
            $payout->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            // Optionally mark related commissions as paid if we had a mapping
            // For now, let's just keep it simple as per requirements

            return $payout;
        });
    }
}
