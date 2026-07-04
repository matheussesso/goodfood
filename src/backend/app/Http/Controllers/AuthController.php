<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Handles registration, authentication and self-service profile management.
 *
 * Authentication uses Sanctum's stateful SPA mode: the session lives in an
 * httpOnly cookie issued by the backend, so no token is ever exposed to
 * client-side JavaScript.
 */
class AuthController extends Controller
{
    /**
     * Register a new customer account and start an authenticated session.
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

        $this->startSession($request, $user);

        return $this->respondSuccess(
            ['user' => UserResource::make($user)],
            'User registered successfully',
            201
        );
    }

    /**
     * Authenticate a user and start an authenticated session.
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

        // Legacy cleanup: revoke any bearer tokens issued before the
        // cookie-based session migration.
        $user->tokens()->delete();

        $this->startSession($request, $user);

        return $this->respondSuccess(
            ['user' => UserResource::make($user)],
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
        return $this->respondSuccess(UserResource::make($request->user()), 'User fetched successfully');
    }

    /**
     * End the authenticated session and invalidate its cookie.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

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

        return $this->respondSuccess(UserResource::make($user->fresh()), 'Profile updated successfully');
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

    /**
     * Log the user into the session guard and rotate the session id to
     * prevent fixation. No-op when the request carries no session (e.g. a
     * non-stateful API client).
     *
     * @param  Request  $request
     * @param  User     $user
     * @return void
     */
    private function startSession(Request $request, User $user): void
    {
        if (! $request->hasSession()) {
            return;
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();
    }
}
