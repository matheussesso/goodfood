<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Lets the user hide or bring back the dashboard's "getting started" guide.
 */
class OnboardingController extends Controller
{
    /**
     * Dismiss the guide.
     */
    public function dismiss(Request $request): JsonResponse
    {
        // Not mass assignable on purpose: only this endpoint writes it.
        $user = $request->user();
        $user->onboarding_dismissed_at = now();
        $user->save();

        return $this->respondSuccess(['onboarding_dismissed' => true], 'Onboarding dismissed');
    }

    /**
     * Show the guide again.
     */
    public function restore(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->onboarding_dismissed_at = null;
        $user->save();

        return $this->respondSuccess(['onboarding_dismissed' => false], 'Onboarding restored');
    }
}
