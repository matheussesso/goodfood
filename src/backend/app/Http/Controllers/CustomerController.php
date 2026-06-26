<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers.
     */
    public function index(Request $request)
    {
        $customers = User::where('role', 'customer')
            ->withCount(['pets', 'orders'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }

    /**
     * Display the specified customer with details.
     */
    public function show($id)
    {
        $customer = User::where('role', 'customer')
            ->with(['pets', 'orders', 'subscriptions'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $customer,
        ]);
    }
}
