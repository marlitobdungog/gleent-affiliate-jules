<?php

namespace App\Http\Requests;

use App\Models\ProductLandingPage;
use App\Rules\SecureHttpsUrl;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreProductLandingPageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'destination_url' => ['required', 'string', 'max:2048', new SecureHttpsUrl],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $this->validateProductHost($validator);

            $duplicateUrl = ProductLandingPage::query()
                ->where('product_id', $this->route('product')->id)
                ->where('is_active', true)
                ->where('destination_url', $this->input('destination_url'))
                ->exists();

            if ($duplicateUrl) {
                $validator->errors()->add('destination_url', 'An active landing page already uses this destination URL.');
            }
        });
    }

    protected function validateProductHost(Validator $validator): void
    {
        $websiteHost = strtolower(parse_url($this->route('product')->website_url ?? '', PHP_URL_HOST) ?: '');
        $destinationHost = strtolower(parse_url($this->input('destination_url', ''), PHP_URL_HOST) ?: '');

        if ($websiteHost === '') {
            $validator->errors()->add('destination_url', 'Set the product website in General before adding landing pages.');
        } elseif ($destinationHost !== $websiteHost) {
            $validator->errors()->add('destination_url', 'The destination must use the product website host.');
        }
    }
}
