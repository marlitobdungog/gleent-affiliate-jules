<?php

namespace Database\Seeders;

use App\Models\MarketingAsset;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class MarketingAssetSeeder extends Seeder
{
    public function run(): void
    {
        $assets = [
            [
                'title' => 'SprintHR Core — Partner Banner (728×90)',
                'type' => 'Banner',
                'format' => 'PNG',
                'file_path' => 'marketing-assets/sprinthr-banner-728x90.png',
                'file_size_bytes' => 250880,
                'sort_order' => 1,
                'content' => 'SprintHR partner banner placeholder',
            ],
            [
                'title' => 'Affiliate Link Copy Templates',
                'type' => 'Copy',
                'format' => 'PDF',
                'file_path' => 'marketing-assets/affiliate-link-copy-templates.pdf',
                'file_size_bytes' => 131072,
                'sort_order' => 2,
                'content' => 'Affiliate link copy templates placeholder',
            ],
            [
                'title' => 'Product One-Pager — SprintHR Payroll',
                'type' => 'Brochure',
                'format' => 'PDF',
                'file_path' => 'marketing-assets/sprinthr-payroll-one-pager.pdf',
                'file_size_bytes' => 1258291,
                'sort_order' => 3,
                'content' => 'SprintHR payroll one-pager placeholder',
            ],
            [
                'title' => 'Social Media Kit — Q3 2026',
                'type' => 'Social',
                'format' => 'ZIP',
                'file_path' => 'marketing-assets/social-media-kit-q3-2026.zip',
                'file_size_bytes' => 5033164,
                'sort_order' => 4,
                'content' => 'Social media kit placeholder',
            ],
            [
                'title' => 'Email Outreach Templates',
                'type' => 'Email',
                'format' => 'DOCX',
                'file_path' => 'marketing-assets/email-outreach-templates.docx',
                'file_size_bytes' => 88064,
                'sort_order' => 5,
                'content' => 'Email outreach templates placeholder',
            ],
        ];

        $disk = Storage::disk('local');

        foreach ($assets as $asset) {
            $content = $asset['content'];
            unset($asset['content']);

            if (! $disk->exists($asset['file_path'])) {
                $disk->put($asset['file_path'], $content);
            }

            MarketingAsset::create($asset);
        }
    }
}
