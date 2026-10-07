<?php

declare(strict_types=1);

namespace App\Http\Requests\Recipe;

use App\Models\Recipe;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates a request to clone a recipe (typically a catalog template) into
 * the user's own recipes, optionally linking the copy to some of their pets.
 */
class CloneRecipeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Only recipes the user can see AND is allowed to copy: catalog templates
     * or their own recipes. A private recipe merely linked to one of their pets
     * is visible but not cloneable.
     */
    public function authorize(): bool
    {
        /** @var Recipe $recipe */
        $recipe = $this->route('recipe');
        $user = $this->user();

        return $user->can('view', $recipe)
            && ($user->isAdmin() || $recipe->is_template || $recipe->user_id === $user->id);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $petExists = Rule::exists('pets', 'id');
        if (! $this->user()->isAdmin()) {
            $petExists = $petExists->where('user_id', $this->user()->id);
        }

        return [
            'name' => ['nullable', 'string', 'max:255'],
            'pet_ids' => ['nullable', 'array'],
            'pet_ids.*' => ['integer', $petExists],
        ];
    }
}
