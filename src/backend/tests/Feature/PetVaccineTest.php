<?php

declare(strict_types=1);

use App\Models\Pet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Create a pet owned by the given user.
 */
function vaccineTestPet(User $user, string $name = 'Rex'): Pet
{
    return Pet::create([
        'user_id' => $user->id,
        'name' => $name,
        'type' => 'dog',
    ]);
}

test('a pet owner can add, update and delete a vaccine record', function () {
    $owner = User::factory()->create();
    $pet = vaccineTestPet($owner);

    $response = $this->actingAs($owner)->postJson("/api/pets/{$pet->id}/vaccines", [
        'name' => 'Antirrábica',
        'application_date' => '2026-01-10',
        'next_due_date' => '2027-01-10',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.name', 'Antirrábica');

    $vaccineId = $response->json('data.id');

    $this->actingAs($owner)->putJson("/api/pets/{$pet->id}/vaccines/{$vaccineId}", [
        'name' => 'Antirrábica V2',
        'application_date' => '2026-01-10',
        'next_due_date' => '2027-02-10',
    ])->assertStatus(200)->assertJsonPath('data.name', 'Antirrábica V2');

    $this->actingAs($owner)->deleteJson("/api/pets/{$pet->id}/vaccines/{$vaccineId}")
        ->assertStatus(200)
        ->assertJsonPath('success', true);

    expect($pet->vaccines()->count())->toBe(0);
});

test('adding a vaccine requires a name and application date', function () {
    $owner = User::factory()->create();
    $pet = vaccineTestPet($owner);

    $this->actingAs($owner)->postJson("/api/pets/{$pet->id}/vaccines", [])
        ->assertStatus(422)
        ->assertJsonStructure(['errors' => ['name', 'application_date']]);
});

test('next_due_date must not be before the application date', function () {
    $owner = User::factory()->create();
    $pet = vaccineTestPet($owner);

    $this->actingAs($owner)->postJson("/api/pets/{$pet->id}/vaccines", [
        'name' => 'V10',
        'application_date' => '2026-05-01',
        'next_due_date' => '2026-04-01',
    ])->assertStatus(422)->assertJsonStructure(['errors' => ['next_due_date']]);
});

test('a customer cannot manage vaccines for another customer\'s pet', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $pet = vaccineTestPet($owner);

    $this->actingAs($intruder)->postJson("/api/pets/{$pet->id}/vaccines", [
        'name' => 'V10',
        'application_date' => '2026-05-01',
    ])->assertStatus(403);

    $vaccine = $pet->vaccines()->create([
        'name' => 'V10',
        'application_date' => '2026-05-01',
    ]);

    $this->actingAs($intruder)->putJson("/api/pets/{$pet->id}/vaccines/{$vaccine->id}", [
        'name' => 'Hacked',
        'application_date' => '2026-05-01',
    ])->assertStatus(403);

    $this->actingAs($intruder)->deleteJson("/api/pets/{$pet->id}/vaccines/{$vaccine->id}")
        ->assertStatus(403);
});
