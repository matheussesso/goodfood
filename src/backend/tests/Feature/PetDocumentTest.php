<?php

declare(strict_types=1);

use App\Models\Pet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/**
 * Create a pet owned by the given user.
 */
function documentTestPet(User $user, string $name = 'Rex'): Pet
{
    return Pet::create([
        'user_id' => $user->id,
        'name' => $name,
        'type' => 'dog',
    ]);
}

test('a pet owner can upload and delete a document', function () {
    Storage::fake('public');
    $owner = User::factory()->create();
    $pet = documentTestPet($owner);

    $response = $this->actingAs($owner)->postJson("/api/pets/{$pet->id}/documents", [
        'category' => 'exam',
        'name' => 'Hemograma completo',
        'file' => UploadedFile::fake()->create('exame.pdf', 200, 'application/pdf'),
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.category', 'exam')
        ->assertJsonPath('data.name', 'Hemograma completo');

    $documentId = $response->json('data.id');
    $filePath = $pet->documents()->findOrFail($documentId)->file_path;
    Storage::disk('public')->assertExists($filePath);

    $this->actingAs($owner)->deleteJson("/api/pets/{$pet->id}/documents/{$documentId}")
        ->assertStatus(200)
        ->assertJsonPath('success', true);

    Storage::disk('public')->assertMissing($filePath);
    expect($pet->documents()->count())->toBe(0);
});

test('uploading a document requires a category, name and file', function () {
    Storage::fake('public');
    $owner = User::factory()->create();
    $pet = documentTestPet($owner);

    $this->actingAs($owner)->postJson("/api/pets/{$pet->id}/documents", [])
        ->assertStatus(422)
        ->assertJsonStructure(['errors' => ['category', 'name', 'file']]);
});

test('a customer cannot upload or delete documents on another customer\'s pet', function () {
    Storage::fake('public');
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $pet = documentTestPet($owner);

    $this->actingAs($intruder)->postJson("/api/pets/{$pet->id}/documents", [
        'category' => 'exam',
        'name' => 'Hemograma',
        'file' => UploadedFile::fake()->create('exame.pdf', 100, 'application/pdf'),
    ])->assertStatus(403);

    $document = $pet->documents()->create([
        'category' => 'exam',
        'name' => 'Hemograma',
        'file_path' => 'pet-documents/existing.pdf',
    ]);

    $this->actingAs($intruder)->deleteJson("/api/pets/{$pet->id}/documents/{$document->id}")
        ->assertStatus(403);
});
