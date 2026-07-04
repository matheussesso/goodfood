<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Handles registration, authentication and self-service profile management.
 */
class AuthController extends Controller
{
    /**
     * Register a new customer account and issue an API token.
     *
     * @param  RegisterRequest  $request
     * @return JsonResponse
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['password'] = Hash::make($validated['password']);

        $user = new User($validated);
        // Role is intentionally not mass assignable; every self-registered
        // account is a customer.
        $user->role = 'customer';
        $user->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->respondSuccess(
            ['user' => $user, 'token' => $token],
            'User registered successfully',
            201
        );
    }

    /**
     * Authenticate a user and issue a fresh API token.
     *
     * @param  LoginRequest  $request
     * @return JsonResponse
     * @throws ValidationException When the credentials are invalid.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        // Delete existing tokens for security
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->respondSuccess(
            ['user' => $user, 'token' => $token],
            'User logged in successfully'
        );
    }

    /**
     * Return the authenticated user.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        return $this->respondSuccess($request->user(), 'User fetched successfully');
    }

    /**
     * Revoke the current access token.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->respondSuccess(null, 'User logged out successfully');
    }

    /**
     * Update the authenticated user's profile information.
     *
     * @param  UpdateProfileRequest  $request
     * @return JsonResponse
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        return $this->respondSuccess($user->fresh(), 'Profile updated successfully');
    }

    /**
     * Update the authenticated user's password.
     *
     * @param  UpdatePasswordRequest  $request
     * @return JsonResponse
     */
    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->validated('current_password'), $user->password)) {
            return $this->respondError('Current password is incorrect.', 422, [
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update(['password' => Hash::make($request->validated('password'))]);

        return $this->respondSuccess(null, 'Password updated successfully');
    }
}
