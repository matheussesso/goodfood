<?php

declare(strict_types=1);

namespace App\Http\Requests\Subscription;

use App\Models\Subscription;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Validates the payload for updating a subscription (status, or the plan's
 * duration + recipe rotation together). Authorization is enforced via
 * SubscriptionPolicy.
 */
class UpdateSubscriptionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var Subscription $subscription */
        $subscription = $this->route('subscription');

        return $this->user()->can('update', $subscription);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'required', 'in:active,paused,cancelled'],
            'recipe_ids' => ['required_with:duration_days', 'array', 'min:1'],
            'recipe_ids.*' => ['required_with:recipe_ids', 'integer', 'exists:recipes,id'],
            'duration_days' => ['required_with:recipe_ids', 'integer', 'min:14', 'multiple_of:7'],
        ];
    }

    /**
     * Ensure `recipe_ids` contains exactly one recipe per 7-day block, whenever
     * the plan's duration and rotation are being replaced together.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (! $this->has('duration_days') || ! $this->has('recipe_ids')) {
                return;
            }

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
