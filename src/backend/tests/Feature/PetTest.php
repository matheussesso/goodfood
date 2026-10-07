<?php

declare(strict_types=1);

use App\Models\Pet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('customers list only their own pets while admins list all of them', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $admin = User::factory()->create(['role' => 'admin']);
    Pet::create(['user_id' => $owner->id, 'name' => 'Mine', 'type' => 'dog']);
    Pet::create(['user_id' => $other->id, 'name' => 'Theirs', 'type' => 'cat']);

    $this->actingAs($owner)->getJson('/api/pets')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Mine');

    $this->actingAs($admin)->getJson('/api/pets')->assertJsonCount(2, 'data');
});

test('a customer creates a pet for themselves and cannot choose another owner', function () {
    $customer = User::factory()->create();
    $other = User::factory()->create();

    $this->actingAs($customer)->postJson('/api/pets', [
        'name' => 'Rex',
        'type' => 'dog',
        'user_id' => $other->id,
    ])->assertStatus(201)->assertJsonPath('data.user_id', $customer->id);
});

test('an admin can create a pet on behalf of a customer', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create();

    $this->actingAs($admin)->postJson('/api/pets', [
        'name' => 'Luna',
        'type' => 'cat',
        'user_id' => $customer->id,
    ])->assertStatus(201)->assertJsonPath('data.user_id', $customer->id);
});

test('pet creation validates its fields', function () {
    $customer = User::factory()->create();

    $this->actingAs($customer)->postJson('/api/pets', [
        'type' => 'bird',
        'weight' => 500,
        'microchip_number' => 'abc',
    ])->assertStatus(422)
        ->assertJsonStructure(['errors' => ['name', 'type', 'weight', 'microchip_number']]);
});

test('an owner can show, update and delete their pet', function () {
    $owner = User::factory()->create();
    $pet = Pet::create(['user_id' => $owner->id, 'name' => 'Rex', 'type' => 'dog']);

    $this->actingAs($owner)->getJson("/api/pets/{$pet->id}")
        ->assertStatus(200)
        ->assertJsonStructure(['data' => ['id', 'recipes', 'orders', 'subscriptions', 'vaccines', 'documents']]);

    $this->actingAs($owner)->putJson("/api/pets/{$pet->id}", ['name' => 'Rex II', 'neutered' => true])
        ->assertStatus(200)
        ->assertJsonPath('data.name', 'Rex II');

    $this->actingAs($owner)->deleteJson("/api/pets/{$pet->id}")->assertStatus(200);
    expect(Pet::find($pet->id))->toBeNull();
});

test('a pet photo upload returns a public url and rejects non-images', function () {
    Storage::fake('public');
    $customer = User::factory()->create();

    $response = $this->actingAs($customer)->postJson('/api/pets/upload-photo', [
        'photo' => UploadedFile::fake()->image('rex.jpg'),
    ])->assertStatus(200);

    expect($response->json('data.photo_url'))->toContain('/storage/pets/');

    $this->actingAs($customer)->postJson('/api/pets/upload-photo', [
        'photo' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'),
    ])->assertStatus(422)->assertJsonStructure(['errors' => ['photo']]);
});

test('pet endpoints require authentication', function () {
    $this->getJson('/api/pets')->assertStatus(401);
    $this->postJson('/api/pets/upload-photo')->assertStatus(401);
});
