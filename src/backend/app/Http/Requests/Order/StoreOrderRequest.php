<?php

declare(strict_types=1);

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for creating an order. Per-item pet ownership is
 * verified in OrderController::store against the authenticated user's pets.
 */
class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'items'             => ['required', 'array', 'min:1'],
            'items.*.recipe_id' => ['required', 'integer', 'exists:recipes,id'],
            'items.*.pet_id'    => ['nullable', 'integer', 'exists:pets,id'],
            'delivery_address'  => ['nullable', 'string', 'max:1000'],
        ];
    }
}
