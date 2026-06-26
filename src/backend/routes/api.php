<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

use App\Http\Controllers\PetController;
use App\Http\Controllers\IngredientController;
use App\Http\Controllers\RecipeController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\OrderController;

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\GeneralSettingController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Admin routes
    Route::middleware(\App\Http\Middleware\AdminMiddleware::class)->group(function () {
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::get('/customers/{id}', [CustomerController::class, 'show']);
        
        Route::get('/settings', [GeneralSettingController::class, 'index']);
        Route::put('/settings', [GeneralSettingController::class, 'update']);
    });
    
    Route::apiResource('pets', PetController::class);
    Route::apiResource('ingredients', IngredientController::class);
    Route::apiResource('recipes', RecipeController::class);
    Route::post('recipes/calculate-cost', [RecipeController::class, 'calculateCost']);
    Route::apiResource('subscriptions', SubscriptionController::class);
    Route::apiResource('orders', OrderController::class);
});
