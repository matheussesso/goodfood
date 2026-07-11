<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\GeneralSettingController;
use App\Http\Controllers\IngredientController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PetController;
use App\Http\Controllers\PetDocumentController;
use App\Http\Controllers\PetVaccineController;
use App\Http\Controllers\RecipeController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Middleware\AdminMiddleware;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/profile/password', [AuthController::class, 'updatePassword']);

    // Admin routes
    Route::middleware(AdminMiddleware::class)->group(function () {
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::get('/customers/{id}', [CustomerController::class, 'show']);
        Route::put('/customers/{id}', [CustomerController::class, 'update']);

        Route::get('/settings', [GeneralSettingController::class, 'index']);
        Route::put('/settings', [GeneralSettingController::class, 'update']);
    });

    Route::post('pets/upload-photo', [PetController::class, 'uploadPhoto']);
    Route::apiResource('pets', PetController::class);
    Route::post('pets/{pet}/vaccines', [PetVaccineController::class, 'store']);
    Route::put('pets/{pet}/vaccines/{vaccine}', [PetVaccineController::class, 'update']);
    Route::delete('pets/{pet}/vaccines/{vaccine}', [PetVaccineController::class, 'destroy']);
    Route::post('pets/{pet}/documents', [PetDocumentController::class, 'store']);
    Route::delete('pets/{pet}/documents/{document}', [PetDocumentController::class, 'destroy']);
    Route::apiResource('ingredients', IngredientController::class);
    Route::apiResource('recipes', RecipeController::class);
    Route::post('recipes/calculate-cost', [RecipeController::class, 'calculateCost']);
    Route::apiResource('subscriptions', SubscriptionController::class);
    Route::apiResource('orders', OrderController::class);
});
