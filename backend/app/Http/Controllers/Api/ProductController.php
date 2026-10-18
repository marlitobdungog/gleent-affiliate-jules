<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductLandingPageRequest;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductAffiliateSettingsRequest;
use App\Http\Requests\UpdateProductLandingPageRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Models\ProductAffiliateSetting;
use App\Models\ProductConfigurationAudit;
use App\Models\ProductLandingPage;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Product::all());
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = DB::transaction(function () use ($request) {
            $product = Product::create($request->validated());
            $this->recordAudit($request, $product, 'general', null, $product->only([
                'name', 'slug', 'description', 'website_url', 'status',
                'default_commission_type', 'default_commission_rate',
            ]));

            return $product;
        });

        return response()->json($product, 201);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load([
            'affiliateSettings',
            'landingPages' => fn ($query) => $query->orderByDesc('is_default')->orderBy('id'),
        ]);

        return response()->json(array_merge($product->toArray(), [
            'global_attribution_window_days' => (int) (Setting::where('key', 'default_attribution_window_days')->value('value') ?? 30),
        ]));
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $product = DB::transaction(function () use ($request, $product): Product {
            $lockedProduct = Product::query()->whereKey($product->id)->lockForUpdate()->firstOrFail();
            $data = $request->validated();
            $before = $lockedProduct->only([
                'name', 'slug', 'description', 'website_url', 'status',
                'default_commission_type', 'default_commission_rate',
            ]);

            if (array_key_exists('website_url', $data)) {
                $this->assertWebsiteCompatibleWithLandingPages($lockedProduct, $data['website_url']);
            }

            $lockedProduct->update($data);
            $this->recordAudit($request, $lockedProduct, $this->commissionOnly($data) ? 'commissions' : 'general', $before, $lockedProduct->only(array_keys($before)));

            return $lockedProduct->fresh();
        });

        return response()->json($product);
    }

    public function destroy(Product $product): JsonResponse
    {
        $before = $product->only([
            'name', 'slug', 'description', 'website_url', 'status',
            'default_commission_type', 'default_commission_rate',
        ]);
        DB::transaction(function () use ($product, $before): void {
            $this->recordAudit(request(), $product, 'general', $before, null);
            $product->delete();
        });

        return response()->json(null, 204);
    }

    public function updateAffiliateSettings(UpdateProductAffiliateSettingsRequest $request, Product $product): JsonResponse
    {
        $data = $request->validated();
        $settings = DB::transaction(function () use ($request, $product, $data) {
            $lockedProduct = Product::query()->whereKey($product->id)->lockForUpdate()->firstOrFail();
            if (! empty($data['base_destination_url'])) {
                $this->assertDestinationHost($data['base_destination_url'], $lockedProduct);
            }
            $settings = ProductAffiliateSetting::firstOrNew(['product_id' => $lockedProduct->id]);
            $beforeDestination = $lockedProduct->landingPages()->where('is_active', true)->where('is_default', true)->first();
            $before = [
                'settings' => $settings->exists ? $settings->only(['tracking_mode', 'referral_parameter', 'attribution_window_days']) : null,
                'base_destination_url' => $beforeDestination?->destination_url,
            ];

            $settings->fill([
                'tracking_mode' => $data['tracking_mode'],
                'referral_parameter' => $data['referral_parameter'],
                'attribution_window_days' => $data['attribution_window_days'] ?? null,
            ])->save();

            if (! empty($data['base_destination_url'])) {
                $matchingPage = $lockedProduct->landingPages()
                    ->where('is_active', true)
                    ->where('destination_url', $data['base_destination_url'])
                    ->lockForUpdate()
                    ->first();
                if ($matchingPage) {
                    $lockedProduct->landingPages()->update(['is_default' => false]);
                    $matchingPage->update(['is_default' => true]);
                } else {
                    $defaultPage = $lockedProduct->landingPages()->where('is_active', true)->where('is_default', true)->lockForUpdate()->first();
                    if ($defaultPage) {
                        $defaultPage->update(['destination_url' => $data['base_destination_url']]);
                    } else {
                        $lockedProduct->landingPages()->update(['is_default' => false]);
                        $lockedProduct->landingPages()->create([
                            'name' => 'Main Website',
                            'destination_url' => $data['base_destination_url'],
                            'is_default' => true,
                            'is_active' => true,
                        ]);
                    }
                }
            }

            $settings->refresh();
            $defaultDestination = $lockedProduct->landingPages()->where('is_active', true)->where('is_default', true)->value('destination_url');
            $this->recordAudit($request, $lockedProduct, 'affiliate_links', $before, [
                'settings' => $settings->only(['tracking_mode', 'referral_parameter', 'attribution_window_days']),
                'base_destination_url' => $defaultDestination,
            ]);

            return $settings;
        });

        return response()->json([
            'affiliate_settings' => $settings,
            'base_destination_url' => $product->landingPages()->where('is_active', true)->where('is_default', true)->value('destination_url'),
            'global_attribution_window_days' => (int) (Setting::where('key', 'default_attribution_window_days')->value('value') ?? 30),
        ]);
    }

    public function landingPages(Product $product): JsonResponse
    {
        return response()->json($product->landingPages()->orderByDesc('is_default')->orderBy('id')->get());
    }

    public function storeLandingPage(StoreProductLandingPageRequest $request, Product $product): JsonResponse
    {
        $page = DB::transaction(function () use ($request, $product) {
            $lockedProduct = Product::query()->whereKey($product->id)->lockForUpdate()->firstOrFail();
            $validated = $request->validated();
            $this->assertDestinationHost($validated['destination_url'], $lockedProduct);
            $isDefault = ! $lockedProduct->landingPages()->where('is_active', true)->where('is_default', true)->exists();
            $page = $lockedProduct->landingPages()->create([
                ...$validated,
                'is_default' => $isDefault,
                'is_active' => true,
            ]);
            $this->recordAudit($request, $lockedProduct, 'landing_pages', null, $page->only([
                'id', 'name', 'destination_url', 'is_default', 'is_active',
            ]));

            return $page;
        });

        return response()->json($page, 201);
    }

    public function updateLandingPage(UpdateProductLandingPageRequest $request, Product $product, ProductLandingPage $landingPage): JsonResponse
    {
        $page = DB::transaction(function () use ($request, $product, $landingPage) {
            $lockedProduct = Product::query()->whereKey($product->id)->lockForUpdate()->firstOrFail();
            $page = $lockedProduct->landingPages()->whereKey($landingPage->id)->lockForUpdate()->firstOrFail();
            $before = [
                'page' => $page->only(['id', 'name', 'destination_url', 'is_default', 'is_active']),
                'active_defaults' => $lockedProduct->landingPages()->where('is_active', true)->where('is_default', true)->get()
                    ->map(fn (ProductLandingPage $item) => $item->only(['id', 'destination_url']))->all(),
            ];
            $data = $request->validated();
            $destination = $data['destination_url'] ?? $page->destination_url;
            if (($data['is_active'] ?? $page->is_active) || array_key_exists('destination_url', $data)) {
                $this->assertDestinationHost($destination, $lockedProduct);
            }

            if (($data['is_active'] ?? null) === false && $page->is_default) {
                $replacement = $lockedProduct->landingPages()
                    ->where('is_active', true)
                    ->where('id', '<>', $page->id)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->first();
                $replacement?->update(['is_default' => true]);
                $data['is_default'] = false;
            }

            if (($data['is_active'] ?? null) === true
                && ! $lockedProduct->landingPages()->where('is_active', true)->where('is_default', true)->where('id', '<>', $page->id)->exists()) {
                $data['is_default'] = true;
            } elseif (($data['is_active'] ?? null) === true) {
                $data['is_default'] = false;
            }

            $page->update($data);
            $this->recordAudit($request, $lockedProduct, 'landing_pages', $before, [
                'page' => $page->fresh()->only(['id', 'name', 'destination_url', 'is_default', 'is_active']),
                'active_defaults' => $lockedProduct->landingPages()->where('is_active', true)->where('is_default', true)->get()
                    ->map(fn (ProductLandingPage $item) => $item->only(['id', 'destination_url']))->all(),
            ]);

            return $page->fresh();
        });

        return response()->json($page);
    }

    public function makeLandingPageDefault(Request $request, Product $product, ProductLandingPage $landingPage): JsonResponse
    {
        $page = DB::transaction(function () use ($request, $product, $landingPage) {
            $lockedProduct = Product::query()->whereKey($product->id)->lockForUpdate()->firstOrFail();
            $page = $lockedProduct->landingPages()->whereKey($landingPage->id)->lockForUpdate()->firstOrFail();
            abort_unless($page->is_active, 422, 'An archived landing page cannot be the default.');
            $before = $lockedProduct->landingPages()->where('is_active', true)->where('is_default', true)->get()
                ->map(fn (ProductLandingPage $item) => $item->only(['id', 'destination_url']))->all();

            $lockedProduct->landingPages()->update(['is_default' => false]);
            $page->update(['is_default' => true]);
            $this->recordAudit($request, $lockedProduct, 'landing_pages', $before, [[
                'id' => $page->id,
                'destination_url' => $page->destination_url,
            ]]);

            return $page->fresh();
        });

        return response()->json($page);
    }

    private function recordAudit(Request $request, Product $product, string $area, ?array $before, ?array $after): void
    {
        ProductConfigurationAudit::create([
            'product_id' => $product->id,
            'actor_id' => $request->user()?->id,
            'configuration_area' => $area,
            'before_state' => $before,
            'after_state' => $after,
        ]);
    }

    private function assertWebsiteCompatibleWithLandingPages(Product $product, ?string $websiteUrl): void
    {
        $activePages = $product->landingPages()->where('is_active', true)->get();
        if ($activePages->isEmpty()) {
            return;
        }

        $newHost = strtolower(parse_url($websiteUrl ?? '', PHP_URL_HOST) ?: '');
        foreach ($activePages as $page) {
            if ($newHost === '' || strtolower(parse_url($page->destination_url, PHP_URL_HOST) ?: '') !== $newHost) {
                throw ValidationException::withMessages([
                    'website_url' => ['Update or archive active landing pages before changing the product website host.'],
                ]);
            }
        }
    }

    private function assertDestinationHost(string $destinationUrl, Product $product): void
    {
        $websiteHost = strtolower(parse_url($product->website_url ?? '', PHP_URL_HOST) ?: '');
        $destinationHost = strtolower(parse_url($destinationUrl, PHP_URL_HOST) ?: '');
        if ($websiteHost === '' || $destinationHost !== $websiteHost) {
            throw ValidationException::withMessages([
                'destination_url' => ['The destination must use the product website host.'],
            ]);
        }
    }

    private function commissionOnly(array $data): bool
    {
        return count($data) > 0 && collect(array_keys($data))->every(
            fn (string $key) => in_array($key, ['default_commission_type', 'default_commission_rate'], true),
        );
    }
}
