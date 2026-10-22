<?php

declare(strict_types=1);

namespace App\Http\Requests\Pet;

use App\Http\Requests\Recipe\ValidatesMinimumRecipeWeight;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates the payload for creating a pet together with its first recipe.
 *
 * A pet is never created without a recipe: `recipe` is required and is either
 * built from ingredients or copied from a catalog template (`template_id`).
 * `user_id` is only honored for admins (assigning a pet to a customer); see
 * PetController::store.
 */
class StorePetRequest extends FormRequest
{
    use ValidatesMinimumRecipeWeight;

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
            'type' => ['nullable', 'string', 'in:dog,cat'],
            'sex' => ['nullable', 'string', 'in:male,female'],
            'breed' => ['nullable', 'string', 'max:255'],
            'weight' => ['nullable', 'numeric', 'min:0', 'max:120'],
            'age' => ['nullable', 'integer', 'min:0', 'max:360'],
            'birth_date' => ['nullable', 'date'],
            'restrictions' => ['nullable', 'string', 'max:1000'],
            'allergies' => ['nullable', 'string', 'max:1000'],
            'special_needs' => ['nullable', 'string', 'max:1000'],
            'photo_url' => ['nullable', 'string'],
            'neutered' => ['nullable', 'boolean'],
            'microchip_number' => ['nullable', 'string', 'regex:/^\d{9,15}$/'],
            'vet_name' => ['nullable', 'string', 'max:255'],
            'vet_phone' => ['nullable', 'string', 'max:30'],
            'user_id' => ['nullable', 'exists:users,id'],

            'recipe' => ['required', 'array'],
            'recipe.template_id' => [
                'nullable',
                'integer',
                Rule::exists('recipes', 'id')->where('is_template', true)->where('is_active', true),
            ],
            'recipe.name' => ['required_without:recipe.template_id', 'nullable', 'string', 'max:255'],
            'recipe.description' => ['nullable', 'string'],
            'recipe.duration_days' => ['nullable', 'integer', 'min:1'],
            'recipe.daily_portions' => ['nullable', 'integer', 'min:1'],
            'recipe.instructions' => ['nullable', 'string'],
            'recipe.ingredients' => ['required_without:recipe.template_id', 'array', 'min:1'],
            'recipe.ingredients.*.id' => ['required', 'exists:ingredients,id'],
            'recipe.ingredients.*.quantity' => ['required', 'numeric', 'min:0'],
            'recipe.ingredients.*.unit' => ['nullable', 'string'],
        ];
    }

    /**
     * The recipe fields are nested under `recipe.` in this payload.
     */
    protected function recipeInputPrefix(): string
    {
        return 'recipe.';
    }
}
