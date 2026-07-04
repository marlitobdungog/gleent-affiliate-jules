<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationRequest;
use App\Models\Application;
use App\Services\ApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    protected $applicationService;

    public function __construct(ApplicationService $applicationService)
    {
        $this->applicationService = $applicationService;
    }

    public function index(): JsonResponse
    {
        return response()->json(Application::with('targetProduct')->get());
    }

    public function store(StoreApplicationRequest $request): JsonResponse
    {
        $application = Application::create($request->validated());
        return response()->json($application, 201);
    }

    public function show(Application $application): JsonResponse
    {
        return response()->json($application->load('targetProduct'));
    }

    public function update(UpdateApplicationRequest $request, Application $application): JsonResponse
    {
        $application->update($request->validated());
        return response()->json($application);
    }

    public function destroy(Application $application): JsonResponse
    {
        $application->delete();
        return response()->json(null, 204);
    }

    public function approve(Application $application): JsonResponse
    {
        $partner = $this->applicationService->approve($application);
        return response()->json($partner);
    }

    public function reject(Application $application, Request $request): JsonResponse
    {
        $application->update([
            'status' => 'rejected',
            'review_notes' => $request->review_notes
        ]);
        return response()->json($application);
    }

    public function needsMoreInfo(Application $application, Request $request): JsonResponse
    {
        $application->update([
            'status' => 'needs_more_info',
            'review_notes' => $request->review_notes
        ]);
        return response()->json($application);
    }
}
