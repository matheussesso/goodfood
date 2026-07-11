<?php

declare(strict_types=1);

namespace App\Http\Requests\Pet;

use App\Models\Pet;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for attaching a document to a pet (exam, prescription,
 * report, other). Authorization mirrors pet ownership (owner or admin),
 * enforced via PetPolicy.
 */
class StorePetDocumentRequest extends FormRequest
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
            'category' => ['required', 'string', 'in:exam,prescription,report,other'],
            'name' => ['required', 'string', 'max:255'],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }
}
