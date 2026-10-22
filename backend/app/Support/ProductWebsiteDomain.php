<?php

namespace App\Support;

class ProductWebsiteDomain
{
    public static function matches(mixed $websiteUrl, mixed $destinationUrl): bool
    {
        $websiteHost = self::host($websiteUrl);
        $destinationHost = self::host($destinationUrl);

        if ($websiteHost === null || $destinationHost === null) {
            return false;
        }

        $websiteHost = strtolower(rtrim($websiteHost, '.'));
        $destinationHost = strtolower(rtrim($destinationHost, '.'));

        return $destinationHost === $websiteHost
            || str_ends_with($destinationHost, '.'.$websiteHost);
    }

    private static function host(mixed $url): ?string
    {
        if (! is_string($url) || $url === '') {
            return null;
        }

        $host = parse_url($url, PHP_URL_HOST);

        return is_string($host) && $host !== '' ? $host : null;
    }
}
