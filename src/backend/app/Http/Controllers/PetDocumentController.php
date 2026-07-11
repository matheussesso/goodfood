<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Pet\StorePetDocumentRequest;
use App\Http\Resources\PetDocumentResource;
use App\Models\Pet;
use App\Models\PetDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Manages documents (exams, prescriptions, reports) attached to a pet.
 * Ownership rules mirror PetPolicy (owner or admin) via the parent pet.
 */
class PetDocumentController extends Controller
{
    /**
     * Upload and attach a document to the pet.
     */
    public function store(StorePetDocumentRequest $request, Pet $pet): JsonResponse
    {
        $path = $request->file('file')->store('pet-documents', 'public');

        $document = $pet->documents()->create([
            'category' => $request->validated('category'),
            'name' => $request->validated('name'),
            'file_path' => $path,
        ]);

        return $this->respondSuccess(PetDocumentResource::make($document), 'Document uploaded successfully', 201);
    }

    /**
     * Delete a document and its underlying file.
     */
    public function destroy(Request $request, Pet $pet, PetDocument $document): JsonResponse
    {
        $this->authorize('update', $pet);
        abort_unless($document->pet_id === $pet->id, 404);

        Storage::disk('public')->delete($document->file_path);
        $document->delete();

        return $this->respondSuccess(null, 'Document deleted successfully');
    }
}
