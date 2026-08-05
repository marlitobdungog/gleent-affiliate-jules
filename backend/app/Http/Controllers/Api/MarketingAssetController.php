<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMarketingAssetRequest;
use App\Http\Requests\UpdateMarketingAssetRequest;
use App\Models\MarketingAsset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MarketingAssetController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            MarketingAsset::query()
                ->with('products:id,name,status')
                ->orderBy('sort_order')
                ->latest('updated_at')
                ->get()
                ->map(fn (MarketingAsset $asset) => $this->serialize($asset))
                ->values()
        );
    }

    public function store(StoreMarketingAssetRequest $request): JsonResponse
    {
        $filePath = $this->storeUploadedFile($request);

        try {
            $asset = DB::transaction(function () use ($request, $filePath): MarketingAsset {
                $asset = MarketingAsset::create([
                    ...$this->assetData($request),
                    ...$this->fileData($request, $filePath),
                ]);
                $asset->products()->sync($request->validated('product_ids') ?? []);

                return $asset->load('products:id,name,status');
            });
        } catch (\Throwable $exception) {
            Storage::disk('local')->delete($filePath);
            throw $exception;
        }

        return response()->json($this->serialize($asset), 201);
    }

    public function show(MarketingAsset $marketingAsset): JsonResponse
    {
        return response()->json($this->serialize($marketingAsset->load('products:id,name,status')));
    }

    public function update(UpdateMarketingAssetRequest $request, MarketingAsset $marketingAsset): JsonResponse
    {
        $newFilePath = $request->hasFile('file') ? $this->storeUploadedFile($request) : null;
        $previousFilePath = $marketingAsset->file_path;

        try {
            $asset = DB::transaction(function () use ($request, $marketingAsset, $newFilePath): MarketingAsset {
                $data = $this->assetData($request);
                if ($newFilePath) {
                    $data = [...$data, ...$this->fileData($request, $newFilePath)];
                }

                $marketingAsset->update($data);
                if ($request->has('product_ids')) {
                    $marketingAsset->products()->sync($request->validated('product_ids') ?? []);
                }

                return $marketingAsset->load('products:id,name,status');
            });
        } catch (\Throwable $exception) {
            if ($newFilePath) {
                Storage::disk('local')->delete($newFilePath);
            }
            throw $exception;
        }

        if ($newFilePath && $previousFilePath !== $newFilePath) {
            Storage::disk('local')->delete($previousFilePath);
        }

        return response()->json($this->serialize($asset));
    }

    public function destroy(MarketingAsset $marketingAsset): JsonResponse
    {
        $filePath = $marketingAsset->file_path;
        $marketingAsset->delete();
        Storage::disk('local')->delete($filePath);

        return response()->json(null, 204);
    }

    private function storeUploadedFile(StoreMarketingAssetRequest|UpdateMarketingAssetRequest $request): string
    {
        $file = $request->file('file');
        $extension = $file->extension();
        $filename = Str::uuid().'.'.$extension;

        return $file->storeAs('marketing-assets', $filename, 'local');
    }

    private function assetData(StoreMarketingAssetRequest|UpdateMarketingAssetRequest $request): array
    {
        return $request->safe()->only(['title', 'type', 'is_active', 'sort_order']);
    }

    private function fileData(StoreMarketingAssetRequest|UpdateMarketingAssetRequest $request, string $filePath): array
    {
        $file = $request->file('file');

        return [
            'file_path' => $filePath,
            'format' => strtoupper($file->extension()),
            'file_size_bytes' => $file->getSize(),
        ];
    }

    private function serialize(MarketingAsset $asset): array
    {
        return [
            'id' => $asset->id,
            'title' => $asset->title,
            'type' => $asset->type,
            'format' => $asset->format,
            'file_size_bytes' => $asset->file_size_bytes,
            'is_active' => $asset->is_active,
            'sort_order' => $asset->sort_order,
            'products' => $asset->products->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'status' => $product->status,
            ])->values(),
            'created_at' => $asset->created_at,
            'updated_at' => $asset->updated_at,
        ];
    }
}
