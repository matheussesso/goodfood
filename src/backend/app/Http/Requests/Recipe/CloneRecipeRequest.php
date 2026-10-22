<?php

declare(strict_types=1);

namespace App\Http\Requests\Recipe;

use App\Models\Recipe;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates a request to copy a recipe (typically a catalog template) into one
 * of the user's pets.
 */
class CloneRecipeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * Only recipes the user can see AND is allowed to copy: catalog templates
     * or recipes of their own pets.
     */
    public function authorize(): bool
    {
        /** @var Recipe $recipe */
        $recipe = $this->route('recipe');

        return $this->user()->can('view', $recipe);
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
            'pet_id' => ['required', 'integer', $petExists],
        ];
    }
}
