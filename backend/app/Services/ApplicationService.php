<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Setting;
use App\Models\Partner;
use Illuminate\Support\Facades\DB;

class ApplicationService
{
    protected $partnerService;

    public function __construct(PartnerService $partnerService)
    {
        $this->partnerService = $partnerService;
    }

    public function approve(Application $application)
    {
        return DB::transaction(function () use ($application) {
            $application->update(['status' => 'approved']);

            $defaultType = Setting::where('key', 'default_commission_type')->value('value') ?? 'percentage';
            $defaultRate = Setting::where('key', 'default_commission_rate')->value('value') ?? 10;

            return $this->partnerService->createPartner([
                'name' => $application->name,
                'email' => $application->email,
                'phone' => $application->phone,
                'company_name' => $application->company_name,
                'status' => 'active',
                'commission_type' => $defaultType,
                'commission_rate' => $defaultRate,
                'joined_at' => now(),
                'approved_at' => now(),
            ]);
        });
    }
}
