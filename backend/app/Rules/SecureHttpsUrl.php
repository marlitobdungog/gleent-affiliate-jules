<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class SecureHttpsUrl implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || trim($value) !== $value || filter_var($value, FILTER_VALIDATE_URL) === false) {
            $fail('The :attribute must be a valid HTTPS URL.');

            return;
        }

        $parts = parse_url($value);
        $host = strtolower($parts['host'] ?? '');
        $isLocalHost = $host === 'localhost' || str_ends_with($host, '.localhost');

        if (($parts['scheme'] ?? null) !== 'https' || $host === '' || isset($parts['user']) || isset($parts['pass'])) {
            $fail('The :attribute must use HTTPS and cannot include embedded credentials.');

            return;
        }

        if ($isLocalHost && app()->environment(['local', 'testing'])) {
            return;
        }

        if ($isLocalHost || str_ends_with($host, '.local') || str_ends_with($host, '.internal') || str_ends_with($host, '.test')) {
            $fail('The :attribute must use a public, approved host.');

            return;
        }

        if (filter_var($host, FILTER_VALIDATE_IP) !== false
            && filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            $fail('The :attribute cannot target a private or reserved IP address.');
        }
    }
}
