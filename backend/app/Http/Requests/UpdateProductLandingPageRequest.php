<?php

namespace App\Http\Requests;

use App\Models\ProductLandingPage;
use App\Rules\SecureHttpsUrl;
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

            $websiteHost = strtolower(parse_url($this->route('product')->website_url ?? '', PHP_URL_HOST) ?: '');
            $destination = $this->input('destination_url', $page->destination_url);
            $destinationHost = strtolower(parse_url($destination, PHP_URL_HOST) ?: '');

            if ($websiteHost === '') {
                $validator->errors()->add('destination_url', 'Set the product website in General before editing landing pages.');
            } elseif ($destinationHost !== $websiteHost) {
                $validator->errors()->add('destination_url', 'The destination must use the product website host.');
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
