<?php

declare(strict_types=1);

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for creating a subscription. Pet ownership is
 * verified in SubscriptionController::store.
 */
class StoreSubscriptionRequest extends FormRequest
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
            'pet_id'        => ['required', 'exists:pets,id'],
            'recipe_ids'    => ['required', 'array', 'min:1'],
            'recipe_ids.*'  => ['required', 'integer', 'exists:recipes,id'],
            'start_date'    => ['required', 'date', 'after_or_equal:today'],
            'interval_days' => ['required', 'integer', 'min:14', 'multiple_of:7'],
        ];
    }
}
