<?php

namespace App\Http\Requests;

use App\Models\ProductLandingPage;
use App\Rules\SecureHttpsUrl;
use App\Support\ProductWebsiteDomain;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateProductLandingPageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'destination_url' => ['sometimes', 'required', 'string', 'max:2048', new SecureHttpsUrl],
            'is_active' => 'sometimes|required|boolean',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $page = $this->route('landingPage');
            $willBeActive = filter_var($this->input('is_active', $page->is_active), FILTER_VALIDATE_BOOLEAN);
            if (! $this->exists('destination_url') && ! $willBeActive) {
                return;
            }

            $websiteUrl = $this->route('product')->website_url;
            $destination = $this->input('destination_url', $page->destination_url);

            if (! $websiteUrl) {
                $validator->errors()->add('destination_url', 'Set the product website in General before editing landing pages.');
            } elseif (! ProductWebsiteDomain::matches($websiteUrl, $destination)) {
                $validator->errors()->add('destination_url', 'The destination must use the product website domain or one of its subdomains.');
            }

            if ($this->exists('destination_url') && $willBeActive && ProductLandingPage::query()
                ->where('product_id', $this->route('product')->id)
                ->where('is_active', true)
                ->where('destination_url', $destination)
                ->where('id', '<>', $page->id)
                ->exists()) {
                $validator->errors()->add('destination_url', 'An active landing page already uses this destination URL.');
            }
        });
    }
}
