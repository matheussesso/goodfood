<?php

declare(strict_types=1);

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Validates the payload for creating a subscription. Pet ownership is
 * verified in SubscriptionController::store.
 */
class StoreSubscriptionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
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
            'pet_id' => ['required', 'exists:pets,id'],
            'recipe_ids' => ['required', 'array', 'min:1'],
            'recipe_ids.*' => ['required', 'integer', 'exists:recipes,id'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'duration_days' => ['required', 'integer', 'min:14', 'multiple_of:7'],
        ];
    }

    /**
     * Ensure `recipe_ids` contains exactly one recipe per 7-day block.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $durationDays = (int) $this->input('duration_days', 0);
            $recipeIds = (array) $this->input('recipe_ids', []);
            $expected = intdiv($durationDays, 7);

            if ($durationDays > 0 && count($recipeIds) !== $expected) {
                $validator->errors()->add(
                    'recipe_ids',
                    "The recipe_ids array must contain exactly {$expected} recipe(s) for a {$durationDays}-day plan."
                );
            }
        });
    }
}
