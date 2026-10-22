<?php

declare(strict_types=1);

namespace App\Http\Requests\Recipe;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates the payload for creating a recipe. A customer recipe always
 * belongs to one of the customer's pets (`pet_id`); only admins may create
 * catalog templates, which have no pet.
 */
class StoreRecipeRequest extends FormRequest
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
        $isAdmin = $this->user()->isAdmin();

        $petExists = Rule::exists('pets', 'id');
        if (! $isAdmin) {
            $petExists = $petExists->where('user_id', $this->user()->id);
        }

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
            'pet_id' => [
                Rule::requiredIf(fn (): bool => ! ($isAdmin && $this->boolean('is_template'))),
                'nullable',
                'integer',
                $petExists,
            ],
            'ingredients' => ['nullable', 'array'],
            'ingredients.*.id' => ['required', 'exists:ingredients,id'],
            'ingredients.*.quantity' => ['required', 'numeric', 'min:0'],
            'ingredients.*.unit' => ['nullable', 'string'],
            'user_id' => ['nullable', 'exists:users,id'],
        ];
    }

    /**
     * Get the validated data. Customers can never create templates nor choose
     * the owner: the recipe always belongs to their pet.
     *
     * @param  mixed  $key
     * @param  mixed  $default
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
