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
        ];
    }
}
