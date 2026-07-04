<?php

declare(strict_types=1);

namespace App\Http\Requests\Subscription;

use App\Models\Subscription;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for updating a subscription (status, recipe rotation,
 * or cycle interval). Authorization is enforced via SubscriptionPolicy.
 */
class UpdateSubscriptionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
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
            'status'        => ['sometimes', 'required', 'in:active,paused,cancelled'],
            'recipe_ids'    => ['sometimes', 'required', 'array', 'min:1'],
            'recipe_ids.*'  => ['required_with:recipe_ids', 'integer', 'exists:recipes,id'],
            'interval_days' => ['sometimes', 'required', 'integer', 'min:14', 'multiple_of:7'],
        ];
    }
}
