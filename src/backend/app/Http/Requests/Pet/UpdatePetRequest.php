<?php

declare(strict_types=1);

namespace App\Http\Requests\Pet;

use App\Models\Pet;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for updating a pet. Authorization is enforced via
 * PetPolicy. `user_id` (pet reassignment) is stripped for non-admins in
 * validated() to prevent ownership transfer by customers.
 */
class UpdatePetRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var Pet $pet */
        $pet = $this->route('pet');

        return $this->user()->can('update', $pet);
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
            'type' => ['nullable', 'string', 'in:dog,cat'],
            'breed' => ['nullable', 'string', 'max:255'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'age' => ['nullable', 'integer', 'min:0'],
            'birth_date' => ['nullable', 'date'],
            'restrictions' => ['nullable', 'string'],
            'allergies' => ['nullable', 'string'],
            'special_needs' => ['nullable', 'string'],
            'photo_url' => ['nullable', 'string'],
            'user_id' => ['nullable', 'exists:users,id'],
        ];
    }

    /**
     * Get the validated data, stripping `user_id` for non-admin users so a
     * customer can never reassign a pet to another account.
     *
     * @param  mixed  $key
     * @param  mixed  $default
     */
    public function validated($key = null, $default = null): mixed
    {
        $validated = parent::validated($key, $default);

        if ($key === null && is_array($validated) && ! $this->user()->isAdmin()) {
            unset($validated['user_id']);
        }

        return $validated;
    }
}
