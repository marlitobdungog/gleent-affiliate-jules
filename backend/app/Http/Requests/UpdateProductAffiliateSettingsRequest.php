<?php

namespace App\Http\Requests;

use App\Rules\SecureHttpsUrl;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateProductAffiliateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tracking_mode' => 'required|in:redirect,direct',
            'referral_parameter' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z][A-Za-z0-9_-]*$/'],
            'attribution_window_days' => 'nullable|integer|min:1|max:3650',
            'base_destination_url' => ['nullable', 'string', 'max:2048', new SecureHttpsUrl],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $destination = $this->input('base_destination_url');
            if (! $destination) {
                return;
            }

            $websiteUrl = $this->route('product')->website_url;
            $websiteHost = strtolower(parse_url($websiteUrl ?? '', PHP_URL_HOST) ?: '');
            $destinationHost = strtolower(parse_url($destination, PHP_URL_HOST) ?: '');

            if ($websiteHost === '') {
                $validator->errors()->add('base_destination_url', 'Set the product website in General before configuring a destination.');
            } elseif ($destinationHost !== $websiteHost) {
                $validator->errors()->add('base_destination_url', 'The destination must use the product website host.');
            }
        });
    }
}
