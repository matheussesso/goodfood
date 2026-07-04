<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Admin management of customer accounts. Routes are protected by
 * AdminMiddleware.
 */
class CustomerController extends Controller
{
    /**
     * List customers, optionally filtered by a name/email search term.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'customer')
            ->withCount(['pets', 'orders']);

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $customers = $query->orderBy('created_at', 'desc')->get();

        return $this->respondSuccess($customers, 'Customers fetched successfully');
    }

    /**
     * Create a new customer (admin action).
     *
     * @param  StoreCustomerRequest  $request
     * @return JsonResponse
     */
    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['password'] = Hash::make($validated['password']);

        $customer = new User($validated);
        // Role is intentionally not mass assignable; this endpoint only
        // creates customer accounts.
        $customer->role = 'customer';
        $customer->save();

        return $this->respondSuccess($customer, 'Customer created successfully', 201);
    }

    /**
     * Display the specified customer with full details.
     *
     * @param  int|string  $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        $customer = User::where('role', 'customer')
            ->with(['pets', 'orders', 'subscriptions', 'recipes.ingredients', 'recipes.pets'])
            ->findOrFail($id);

        return $this->respondSuccess($customer, 'Customer fetched successfully');
    }

    /**
     * Update the specified customer's information.
     *
     * @param  UpdateCustomerRequest  $request
     * @param  int|string             $id
     * @return JsonResponse
     */
    public function update(UpdateCustomerRequest $request, $id): JsonResponse
    {
        $customer = User::where('role', 'customer')->findOrFail($id);

        $customer->update($request->validated());

        return $this->respondSuccess($customer, 'Customer updated successfully');
    }
}
