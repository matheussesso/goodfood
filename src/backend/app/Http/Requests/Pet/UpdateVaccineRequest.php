<?php

declare(strict_types=1);

namespace App\Http\Requests\Pet;

use App\Models\Pet;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for updating a pet's vaccination record.
 * Authorization mirrors pet ownership (owner or admin), enforced via PetPolicy.
 */
class UpdateVaccineRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'application_date' => ['required', 'date'],
            'next_due_date' => ['nullable', 'date', 'after_or_equal:application_date'],
        ];
    }
}
