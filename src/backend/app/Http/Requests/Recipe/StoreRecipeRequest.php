<?php

declare(strict_types=1);

namespace App\Http\Requests\Recipe;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for creating a recipe. Template/ownership overrides
 * for non-admins are applied in RecipeController::store.
 */
class StoreRecipeRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'pet_type' => ['nullable', 'string'],
            'duration_days' => ['nullable', 'integer', 'min:1'],
            'daily_portions' => ['nullable', 'integer', 'min:1'],
            'instructions' => ['nullable', 'string'],
            'is_template' => ['boolean'],
            'frequency' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'pet_id' => ['nullable', 'exists:pets,id'],
            'pet_ids' => ['nullable', 'array'],
            'pet_ids.*' => ['exists:pets,id'],
            'ingredients' => ['nullable', 'array'],
            'ingredients.*.id' => ['required', 'exists:ingredients,id'],
            'ingredients.*.quantity' => ['required', 'numeric', 'min:0'],
            'ingredients.*.unit' => ['nullable', 'string'],
            'user_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
