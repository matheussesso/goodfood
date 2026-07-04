<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Send requests as the SPA frontend so Sanctum's stateful middleware
 * attaches the session (cookie-based auth), mirroring production traffic.
 */
function fromSpa(): Illuminate\Foundation\Testing\TestCase
{
    return test()->withHeader('Referer', 'http://localhost:3000');
}

test('a visitor can register and receives an authenticated session', function () {
    $response = fromSpa()->postJson('/api/register', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.user.email', 'john@example.com')
        ->assertJsonMissingPath('data.token');

    $this->assertAuthenticated('web');
});

test('registration ignores an injected role and always creates a customer', function () {
    fromSpa()->postJson('/api/register', [
        'name' => 'Mallory',
        'email' => 'mallory@example.com',
        'password' => 'Password123',
        'password_confirmation' => 'Password123',
        'role' => 'admin',
    ])->assertStatus(201);

    expect(User::where('email', 'mallory@example.com')->first()->role)->toBe('customer');
});

test('registration rejects a password without letters and numbers', function () {
    fromSpa()->postJson('/api/register', [
        'name' => 'Weak Pass',
        'email' => 'weak@example.com',
        'password' => 'aaaaaaaa',
        'password_confirmation' => 'aaaaaaaa',
    ])->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonStructure(['success', 'message', 'errors' => ['password']]);
});

test('login fails with wrong credentials using the error contract', function () {
    User::factory()->create(['email' => 'jane@example.com']);

    fromSpa()->postJson('/api/login', [
        'email' => 'jane@example.com',
        'password' => 'wrong-password',
    ])->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonStructure(['success', 'message', 'errors' => ['email']]);

    $this->assertGuest('web');
});

test('login starts a session and revokes legacy bearer tokens', function () {
    $user = User::factory()->create(['email' => 'jane@example.com']);
    $user->createToken('legacy_token');

    fromSpa()->postJson('/api/login', [
        'email' => 'jane@example.com',
        'password' => 'password',
    ])->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.user.email', 'jane@example.com')
        ->assertJsonMissingPath('data.token');

    $this->assertAuthenticated('web');
    expect($user->tokens()->count())->toBe(0);
});

test('an authenticated session can access /me and log out', function () {
    $user = User::factory()->create(['email' => 'jane@example.com']);

    fromSpa()->postJson('/api/login', [
        'email' => 'jane@example.com',
        'password' => 'password',
    ])->assertStatus(200);

    fromSpa()->getJson('/api/me')
        ->assertStatus(200)
        ->assertJsonPath('data.email', 'jane@example.com');

    fromSpa()->postJson('/api/logout')
        ->assertStatus(200)
        ->assertJsonPath('success', true);

    $this->assertGuest('web');
});

test('unauthenticated requests receive a 401 with the error contract', function () {
    $this->getJson('/api/me')
        ->assertStatus(401)
        ->assertJsonPath('success', false);
});

test('password update requires the correct current password', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->putJson('/api/profile/password', [
        'current_password' => 'not-the-password',
        'password' => 'NewPassword123',
        'password_confirmation' => 'NewPassword123',
    ])->assertStatus(422)
        ->assertJsonPath('success', false)
        ->assertJsonStructure(['errors' => ['current_password']]);
});

test('a customer cannot access admin customer management routes', function () {
    $customer = User::factory()->create();

    $this->actingAs($customer)->getJson('/api/customers')
        ->assertStatus(403)
        ->assertJsonPath('success', false);
});
