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
    Storage::fake('local');
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
    Storage::disk('local')->assertExists($filePath);

    $this->actingAs($owner)->deleteJson("/api/pets/{$pet->id}/documents/{$documentId}")
        ->assertStatus(200)
        ->assertJsonPath('success', true);

    Storage::disk('local')->assertMissing($filePath);
    expect($pet->documents()->count())->toBe(0);
});

test('uploading a document requires a category, name and file', function () {
    Storage::fake('local');
    $owner = User::factory()->create();
    $pet = documentTestPet($owner);

    $this->actingAs($owner)->postJson("/api/pets/{$pet->id}/documents", [])
        ->assertStatus(422)
        ->assertJsonStructure(['errors' => ['category', 'name', 'file']]);
});

test('a customer cannot upload or delete documents on another customer\'s pet', function () {
    Storage::fake('local');
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

test('documents are served only to the pet owner or an admin through the download endpoint', function () {
    Storage::fake('local');
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $admin = User::factory()->create(['role' => 'admin']);
    $pet = documentTestPet($owner);

    $response = $this->actingAs($owner)->postJson("/api/pets/{$pet->id}/documents", [
        'category' => 'exam',
        'name' => 'Hemograma',
        'file' => UploadedFile::fake()->create('exame.pdf', 50, 'application/pdf'),
    ])->assertStatus(201);

    $documentId = $response->json('data.id');
    expect($response->json('data.file_url'))->toEndWith("/api/pets/{$pet->id}/documents/{$documentId}/download")
        ->and($response->json('data'))->not->toHaveKey('file_path');

    $this->actingAs($owner)->get("/api/pets/{$pet->id}/documents/{$documentId}/download")->assertOk();
    $this->actingAs($admin)->get("/api/pets/{$pet->id}/documents/{$documentId}/download")->assertOk();
    $this->actingAs($intruder)->getJson("/api/pets/{$pet->id}/documents/{$documentId}/download")->assertStatus(403);
});

test('a document cannot be downloaded through a different pet', function () {
    Storage::fake('local');
    $owner = User::factory()->create();
    $pet = documentTestPet($owner);
    $otherPet = documentTestPet($owner, 'Luna');

    $document = $pet->documents()->create([
        'category' => 'exam',
        'name' => 'Hemograma',
        'file_path' => 'pet-documents/existing.pdf',
    ]);
    Storage::disk('local')->put('pet-documents/existing.pdf', 'x');

    $this->actingAs($owner)->getJson("/api/pets/{$otherPet->id}/documents/{$document->id}/download")->assertStatus(404);
});
