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
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Manages documents (exams, prescriptions, reports) attached to a pet.
 * Ownership rules mirror PetPolicy (owner or admin) via the parent pet.
 *
 * Files live on the private `local` disk and are only reachable through the
 * authorized {@see download()} endpoint — medical documents are never served
 * from the public storage symlink.
 */
class PetDocumentController extends Controller
{
    /**
     * Upload and attach a document to the pet.
     */
    public function store(StorePetDocumentRequest $request, Pet $pet): JsonResponse
    {
        $path = $request->file('file')->store('pet-documents', 'local');

        $document = $pet->documents()->create([
            'category' => $request->validated('category'),
            'name' => $request->validated('name'),
            'file_path' => $path,
        ]);

        return $this->respondSuccess(PetDocumentResource::make($document), 'Document uploaded successfully', 201);
    }

    /**
     * Stream a document to its pet's owner (or an admin).
     */
    public function download(Request $request, Pet $pet, PetDocument $document): StreamedResponse
    {
        $this->authorize('view', $pet);
        abort_unless($document->pet_id === $pet->id, 404);
        abort_unless(Storage::disk('local')->exists($document->file_path), 404);

        return Storage::disk('local')->response($document->file_path, $document->name);
    }

    /**
     * Delete a document and its underlying file.
     */
    public function destroy(Request $request, Pet $pet, PetDocument $document): JsonResponse
    {
        $this->authorize('update', $pet);
        abort_unless($document->pet_id === $pet->id, 404);

        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return $this->respondSuccess(null, 'Document deleted successfully');
    }
}
