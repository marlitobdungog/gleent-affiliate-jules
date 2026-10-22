<?php

namespace App\Http\Requests;

use App\Rules\SecureHttpsUrl;
use App\Support\ProductWebsiteDomain;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $product = $this->route('product');

        return [
            'name' => 'sometimes|required|string|max:255',
            'slug' => ['sometimes', 'required', 'string', Rule::in([$product?->slug])],
            'description' => 'nullable|string',
            'website_url' => ['sometimes', 'nullable', 'string', 'max:2048', new SecureHttpsUrl],
            'status' => 'sometimes|required|in:active,inactive',
            'default_commission_type' => 'sometimes|required|in:percentage,fixed',
            'default_commission_rate' => [
                'sometimes', 'required', 'numeric', 'min:0',
                Rule::when(($this->input('default_commission_type') ?? $product?->default_commission_type) === 'percentage', ['max:100']),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $product = $this->route('product');
            $commissionType = $this->input('default_commission_type', $product->default_commission_type);
            $commissionRate = $this->input('default_commission_rate', $product->default_commission_rate);

            if ($this->exists('default_commission_type')
                && $commissionType !== $product->default_commission_type
                && ! $this->exists('default_commission_rate')) {
                $validator->errors()->add('default_commission_rate', 'Provide a rate when changing the commission type.');
            }

            if ($commissionType === 'percentage' && is_numeric($commissionRate) && (float) $commissionRate > 100) {
                $validator->errors()->add('default_commission_rate', 'Percentage commissions cannot exceed 100.');
            }

            if (! $this->exists('website_url')) {
                return;
            }

            $websiteUrl = $this->input('website_url');

            if (! $websiteUrl) {
                if ($product->landingPages()->where('is_active', true)->exists()) {
                    $validator->errors()->add('website_url', 'Set a new product website before clearing the website while active landing pages exist.');
                }

                return;
            }

            foreach ($product->landingPages()->where('is_active', true)->get() as $page) {
                if (! ProductWebsiteDomain::matches($websiteUrl, $page->destination_url)) {
                    $validator->errors()->add('website_url', 'Update or archive active landing pages before changing the product website host.');
                    break;
                }
            }
        });
    }
}
