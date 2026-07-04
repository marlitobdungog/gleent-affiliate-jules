<?php

namespace App\Services;

use App\Models\Deal;
use Illuminate\Support\Facades\DB;

class DealService
{
    protected $commissionService;

    public function __construct(CommissionService $commissionService)
    {
        $this->commissionService = $commissionService;
    }

    public function updateDeal(Deal $deal, array $data)
    {
        return DB::transaction(function () use ($deal, $data) {
            $deal->update($data);

            if ($deal->status === 'won') {
                $this->commissionService->createFromDeal($deal);
            }

            return $deal;
        });
    }

    public function createDeal(array $data)
    {
        return DB::transaction(function () use ($data) {
            $deal = Deal::create($data);

            if ($deal->status === 'won') {
                $this->commissionService->createFromDeal($deal);
            }

            return $deal;
        });
    }
}
