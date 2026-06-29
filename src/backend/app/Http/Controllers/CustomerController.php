<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CustomerController extends Controller
{
    /**
     * Display a paginated listing of customers.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'customer')
            ->withCount(['pets', 'orders']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $customers = $query->orderBy('created_at', 'desc')->get();

        return response()->json(['success' => true, 'data' => $customers]);
    }

    /**
     * Create a new customer (admin action).
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|email|max:255|unique:users,email',
            'password'     => 'required|string|min:8|confirmed',
            'phone'        => 'nullable|string|max:30',
            'street'       => 'nullable|string|max:255',
            'number'       => 'nullable|string|max:20',
            'complement'   => 'nullable|string|max:100',
            'neighborhood' => 'nullable|string|max:100',
            'city'         => 'nullable|string|max:100',
            'state'        => 'nullable|string|max:2',
            'zipcode'      => 'nullable|string|max:10',
        ]);

        $customer = User::create([
            'name'         => $validated['name'],
            'email'        => $validated['email'],
            'password'     => Hash::make($validated['password']),
            'phone'        => $validated['phone']        ?? null,
            'street'       => $validated['street']       ?? null,
            'number'       => $validated['number']       ?? null,
            'complement'   => $validated['complement']   ?? null,
            'neighborhood' => $validated['neighborhood'] ?? null,
            'city'         => $validated['city']         ?? null,
            'state'        => $validated['state']        ?? null,
            'zipcode'      => $validated['zipcode']      ?? null,
            'role'         => 'customer',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Customer created successfully',
            'data'    => $customer,
        ], 201);
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

        return response()->json(['success' => true, 'data' => $customer]);
    }

    /**
     * Update the specified customer's information.
     *
     * @param  Request     $request
     * @param  int|string  $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        $customer = User::where('role', 'customer')->findOrFail($id);

        $validated = $request->validate([
            'name'         => 'sometimes|required|string|max:255',
            'email'        => 'sometimes|required|email|max:255|unique:users,email,' . $id,
            'phone'        => 'nullable|string|max:30',
            'street'       => 'nullable|string|max:255',
            'number'       => 'nullable|string|max:20',
            'complement'   => 'nullable|string|max:100',
            'neighborhood' => 'nullable|string|max:100',
            'city'         => 'nullable|string|max:100',
            'state'        => 'nullable|string|max:2',
            'zipcode'      => 'nullable|string|max:10',
        ]);

        $customer->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Customer updated successfully',
            'data'    => $customer,
        ]);
    }
}
