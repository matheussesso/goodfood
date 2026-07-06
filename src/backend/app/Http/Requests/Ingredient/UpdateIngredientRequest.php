<?php

declare(strict_types=1);

namespace App\Http\Requests\Ingredient;

use App\Models\Ingredient;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for updating an ingredient (admin only).
 */
class UpdateIngredientRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var Ingredient $ingredient */
        $ingredient = $this->route('ingredient');

        return $this->user()->can('update', $ingredient);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'unit' => ['sometimes', 'required', 'string'],
            'cost_per_unit' => ['sometimes', 'required', 'numeric', 'min:0'],
            'loss_rate' => ['nullable', 'numeric', 'min:0'],
            'difficulty_multiplier' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
