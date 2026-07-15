<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can list users filtered by role', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    User::factory()->create(['role' => 'customer']);
    User::factory()->create(['role' => 'vet']);
    User::factory()->create(['role' => 'petshop']);

    $response = $this->actingAs($admin)->getJson('/api/customers?role=vet');

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.role'))->toBe('vet');
});

test('admin can create a user with a non-customer role', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->postJson('/api/customers', [
        'name' => 'Dra. Ana Vet',
        'email' => 'ana.vet@goodfood.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
        'role' => 'vet',
    ]);

    $response->assertStatus(201);
    expect($response->json('data.role'))->toBe('vet');
    expect(User::where('email', 'ana.vet@goodfood.com')->first()->role)->toBe('vet');
});

test('creating a user without a role defaults to customer', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->postJson('/api/customers', [
        'name' => 'Plain User',
        'email' => 'plain@goodfood.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
    ]);

    $response->assertStatus(201);
    expect($response->json('data.role'))->toBe('customer');
});

test('an invalid role is rejected', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->postJson('/api/customers', [
        'name' => 'Bad Role',
        'email' => 'bad@goodfood.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
        'role' => 'superuser',
    ]);

    $response->assertStatus(422);
});

test('admin can change an existing user\'s role', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'customer']);

    $response = $this->actingAs($admin)->putJson("/api/customers/{$user->id}", [
        'role' => 'petshop',
    ]);

    $response->assertStatus(200);
    expect($user->fresh()->role)->toBe('petshop');
});

test('a non-admin cannot access user management routes', function () {
    $user = User::factory()->create(['role' => 'customer']);

    $this->actingAs($user)->getJson('/api/customers')->assertStatus(403);
});

test('user detail includes subscriptions', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create(['role' => 'customer']);

    $response = $this->actingAs($admin)->getJson("/api/customers/{$customer->id}");

    $response->assertStatus(200);
    expect($response->json('data'))->toHaveKey('subscriptions');
});
