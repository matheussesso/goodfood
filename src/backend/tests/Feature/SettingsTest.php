<?php

declare(strict_types=1);

use App\Models\GeneralSetting;
use App\Models\Ingredient;
use App\Models\Recipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('an admin reads the settings singleton, which is created on first access', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->getJson('/api/settings')
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonStructure(['data' => ['id', 'production_fixed_value']]);

    expect(GeneralSetting::count())->toBe(1);
});

test('an admin updates the settings and the values are persisted', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->putJson('/api/settings', [
        'production_fixed_value' => 45,
        'charge_fixed_multiplier' => 1.1,
    ])->assertStatus(200)->assertJsonPath('success', true);

    $settings = GeneralSetting::getInstance();
    expect((float) $settings->production_fixed_value)->toBe(45.0)
        ->and((float) $settings->charge_fixed_multiplier)->toBe(1.1);
});

test('settings values must be numeric', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->putJson('/api/settings', ['production_fixed_value' => 'abc'])
        ->assertStatus(422)
        ->assertJsonStructure(['errors' => ['production_fixed_value']]);
});

test('a customer cannot read or change the settings', function () {
    $customer = User::factory()->create();

    $this->actingAs($customer)->getJson('/api/settings')->assertStatus(403);
    $this->actingAs($customer)->putJson('/api/settings', ['production_fixed_value' => 1])->assertStatus(403);
});

test('a settings update is reflected immediately in recipe pricing', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $ingredient = Ingredient::create([
        'name' => 'Frango',
        'unit' => 'kg',
        'cost_per_unit' => 10,
        'loss_rate' => 1,
        'difficulty_multiplier' => 1,
    ]);
    $recipe = Recipe::create([
        'name' => 'R',
        'pet_type' => 'dog',
        'duration_days' => 14,
        'daily_portions' => 1,
        'is_template' => true,
    ]);
    $recipe->ingredients()->attach($ingredient->id, ['quantity' => 1, 'unit' => 'kg']);

    $before = (float) $this->actingAs($admin)->getJson("/api/recipes/{$recipe->id}")->json('data.base_cost');

    $this->actingAs($admin)->putJson('/api/settings', ['charge_fixed_value' => 500])->assertStatus(200);

    $after = (float) $this->actingAs($admin)->getJson("/api/recipes/{$recipe->id}")->json('data.base_cost');

    expect($after)->toBeGreaterThan($before);
});

test('the settings singleton is reused whatever its id is and never duplicated', function () {
    // Postgres sequences do not reset between rows, so the row is not always id 1.
    GeneralSetting::query()->forceCreate(['id' => 7]);
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->getJson('/api/settings')->assertJsonPath('data.id', 7);
    $this->actingAs($admin)->putJson('/api/settings', ['charge_fixed_value' => 12])->assertJsonPath('data.id', 7);
    $this->actingAs($admin)->getJson('/api/settings')->assertJsonPath('data.charge_fixed_value', '12.00');

    expect(GeneralSetting::count())->toBe(1);
});
