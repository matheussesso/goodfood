<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Settings\UpdateGeneralSettingRequest;
use App\Http\Resources\GeneralSettingResource;
use App\Models\GeneralSetting;
use Illuminate\Http\JsonResponse;

/**
 * Admin management of global pricing/production settings. Routes are
 * protected by AdminMiddleware.
 */
class GeneralSettingController extends Controller
{
    /**
     * Return the settings singleton.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return $this->respondSuccess(GeneralSettingResource::make(GeneralSetting::getInstance()), 'Settings fetched successfully');
    }

    /**
     * Update the settings singleton.
     *
     * @param  UpdateGeneralSettingRequest  $request
     * @return JsonResponse
     */
    public function update(UpdateGeneralSettingRequest $request): JsonResponse
    {
        $settings = GeneralSetting::getInstance();
        $settings->update($request->validated());

        return $this->respondSuccess(GeneralSettingResource::make($settings), 'Settings updated successfully.');
    }
}
