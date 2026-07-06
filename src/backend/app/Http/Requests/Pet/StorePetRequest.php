<?php

declare(strict_types=1);

namespace App\Http\Requests\Pet;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for creating a pet. `user_id` is only honored
 * for admins (assigning a pet to a customer); see PetController::store.
 */
class StorePetRequest extends FormRequest
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
}
