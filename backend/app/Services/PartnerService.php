<?php

namespace App\Services;

use App\Models\Partner;
use App\Models\Setting;
use Illuminate\Support\Str;

class PartnerService
{
    public function createPartner(array $data)
    {
        if (!isset($data['partner_code'])) {
            $data['partner_code'] = $this->generateUniquePartnerCode($data['name'] ?? $data['company_name'] ?? 'PARTNER');
        }

        if (!isset($data['partner_link'])) {
            $domain = Setting::where('key', 'default_partner_link_domain')->value('value') ?? 'https://sprinthr.com.ph/ref';
            $data['partner_link'] = rtrim($domain, '/') . '/' . $data['partner_code'];
        }

        return Partner::create($data);
    }

    public function generateUniquePartnerCode(string $name): string
    {
        $initials = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $name), 0, 3));
        $year = date('Y');

        $code = $initials . $year;

        while (Partner::where('partner_code', $code)->exists()) {
            $code = $initials . rand(1000, 9999);
        }

        return $code;
    }
}
