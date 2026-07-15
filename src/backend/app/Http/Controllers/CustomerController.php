<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Admin management of user accounts (customers, vets, pet shops, production
 * and delivery staff, and other admins). Routes are protected by
 * AdminMiddleware.
 */
class CustomerController extends Controller
{
    /** @var array<int, string> Every role manageable from this admin area. */
    public const ROLES = ['customer', 'admin', 'producer', 'delivery', 'vet', 'petshop'];

    /**
     * List users, optionally filtered by role and/or a name/email search term.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::withCount(['pets', 'orders']);

        if ($request->filled('role') && in_array($request->string('role')->toString(), self::ROLES, true)) {
            $query->where('role', $request->string('role')->toString());
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        return $this->respondSuccess(UserResource::collection($users), 'Users fetched successfully');
    }

    /**
     * Create a new user account (admin action), for any manageable role.
     */
    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['password'] = Hash::make($validated['password']);
        $role = $validated['role'] ?? 'customer';
        unset($validated['role']);

        $user = new User($validated);
        // Role is intentionally not mass assignable; set explicitly from the
        // validated (whitelisted) value instead.
        $user->role = $role;
        $user->save();

        return $this->respondSuccess(UserResource::make($user), 'User created successfully', 201);
    }

    /**
     * Display the specified user with full details (pets, orders,
     * subscriptions, recipes).
     *
     * @param  int|string  $id
     */
    public function show($id): JsonResponse
    {
        $user = User::with([
            'pets',
            'orders.items.recipe.ingredients',
            'orders.invoice',
            'subscriptions.recipes.ingredients',
            'recipes.ingredients',
            'recipes.pets',
        ])->findOrFail($id);

        return $this->respondSuccess(UserResource::make($user), 'User fetched successfully');
    }

    /**
     * Update the specified user's information, including role.
     *
     * @param  int|string  $id
     */
    public function update(UpdateCustomerRequest $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validated();
        $role = $validated['role'] ?? null;
        unset($validated['role']);

        $user->update($validated);

        if ($role !== null) {
            $user->role = $role;
            $user->save();
        }

        return $this->respondSuccess(UserResource::make($user), 'User updated successfully');
    }
}
