<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\DashboardResource;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Serves the authenticated customer's dashboard summary.
 */
class DashboardController extends Controller
{
    /**
     * Return onboarding progress, alerts and in-flight orders/subscription.
     */
    public function show(Request $request, DashboardService $dashboard): JsonResponse
    {
        return $this->respondSuccess(
            DashboardResource::make($dashboard->summary($request->user())),
            'Dashboard fetched successfully'
        );
    }
}
