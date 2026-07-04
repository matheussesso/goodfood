<?php

declare(strict_types=1);

namespace App\Http\Requests\Recipe;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for the ad-hoc recipe cost calculation endpoint.
 */
class CalculateRecipeCostRequest extends FormRequest
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
            'ingredients'                 => ['required', 'array'],
            'ingredients.*.ingredient_id' => ['required', 'exists:ingredients,id'],
            'ingredients.*.quantity'      => ['required', 'numeric', 'min:0'],
            'ingredients.*.unit'          => ['nullable', 'string'],
            'duration_days'               => ['nullable', 'integer', 'min:1'],
            'daily_portions'              => ['nullable', 'integer', 'min:1'],
        ];
    }
}
