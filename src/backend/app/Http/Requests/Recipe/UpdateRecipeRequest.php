<?php

declare(strict_types=1);

namespace App\Http\Requests\Recipe;

use App\Models\Recipe;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for updating a recipe. Authorization is enforced via
 * RecipePolicy. `user_id` and `is_template` are stripped for non-admins in
 * validated() so customers can neither reassign ownership nor promote a
 * recipe to template.
 */
class UpdateRecipeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        /** @var Recipe $recipe */
        $recipe = $this->route('recipe');

        return $this->user()->can('update', $recipe);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name'                     => ['sometimes', 'required', 'string', 'max:255'],
            'description'              => ['nullable', 'string'],
            'pet_type'                 => ['nullable', 'string'],
            'duration_days'            => ['nullable', 'integer', 'min:1'],
            'daily_portions'           => ['nullable', 'integer', 'min:1'],
            'instructions'             => ['nullable', 'string'],
            'is_template'              => ['boolean'],
            'frequency'                => ['nullable', 'string'],
            'is_active'                => ['boolean'],
            'pet_id'                   => ['nullable', 'exists:pets,id'],
            'pet_ids'                  => ['nullable', 'array'],
            'pet_ids.*'                => ['exists:pets,id'],
            'ingredients'              => ['nullable', 'array'],
            'ingredients.*.id'         => ['required', 'exists:ingredients,id'],
            'ingredients.*.quantity'   => ['required', 'numeric', 'min:0'],
            'ingredients.*.unit'       => ['nullable', 'string'],
            'user_id'                  => ['nullable', 'exists:users,id'],
        ];
    }

    /**
     * Get the validated data, stripping ownership/template fields for
     * non-admin users.
     *
     * @param  mixed  $key
     * @param  mixed  $default
     * @return mixed
     */
    public function validated($key = null, $default = null): mixed
    {
        $validated = parent::validated($key, $default);

        if ($key === null && is_array($validated) && ! $this->user()->isAdmin()) {
            unset($validated['user_id'], $validated['is_template']);
        }

        return $validated;
    }
}
