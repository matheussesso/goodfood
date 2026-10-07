<?php

declare(strict_types=1);

use App\Models\Ingredient;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Pet;
use App\Models\Recipe;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/**
 * Create a pet owned by the user.
 *
 * @param  array<string, mixed>  $overrides
 */
function dashPet(User $user, array $overrides = []): Pet
{
    return Pet::create($overrides + [
        'user_id' => $user->id,
        'name' => 'Rex',
        'type' => 'dog',
        'sex' => 'male',
        'neutered' => true,
        'breed' => 'SRD',
        'weight' => 10,
        'age' => 24,
    ]);
}

/**
 * Create a private (non-template) recipe owned by the user.
 */
function dashRecipe(User $user, string $name = 'Frango'): Recipe
{
    return Recipe::create([
        'user_id' => $user->id,
        'name' => $name,
        'pet_type' => 'dog',
        'duration_days' => 14,
        'daily_portions' => 1,
        'is_template' => false,
    ]);
}

test('a brand new customer is guided to add the first pet', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->getJson('/api/dashboard')
        ->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.progress.next_step', 'add_pet')
        ->assertJsonPath('data.progress.pets_count', 0)
        ->assertJsonPath('data.progress.has_address', false)
        ->assertJsonPath('data.onboarding_dismissed', false)
        ->assertJsonPath('data.current_order', null)
        ->assertJsonPath('data.active_subscription', null)
        ->assertJsonCount(0, 'data.pets')
        ->assertJsonCount(0, 'data.recent_orders');
});

test('the next step follows pet, recipe, link and first order', function () {
    $user = User::factory()->create();
    $step = fn () => $this->actingAs($user)->getJson('/api/dashboard')->json('data.progress.next_step');

    $pet = dashPet($user);
    expect($step())->toBe('create_recipe');

    $recipe = dashRecipe($user);
    expect($step())->toBe('link_recipe');
    $this->actingAs($user)->getJson('/api/dashboard')->assertJsonPath('data.progress.first_unlinked_recipe_id', $recipe->id);

    $pet->recipes()->attach($recipe->id);
    expect($step())->toBe('place_order');
    $this->actingAs($user)->getJson('/api/dashboard')->assertJsonPath('data.progress.first_unlinked_recipe_id', null);

    Order::create(['user_id' => $user->id, 'total_price' => 10, 'status' => 'pending_payment']);
    expect($step())->toBe('complete');
});

test('templates linked to a pet do not count as the customer having a recipe', function () {
    $user = User::factory()->create();
    $pet = dashPet($user);
    $template = Recipe::create(['name' => 'Template', 'pet_type' => 'dog', 'is_template' => true]);
    $pet->recipes()->attach($template->id);

    $this->actingAs($user)->getJson('/api/dashboard')
        ->assertJsonPath('data.progress.next_step', 'create_recipe')
        ->assertJsonPath('data.progress.linked_recipes_count', 0);
});

test('a subscription also counts as the first purchase', function () {
    $user = User::factory()->create();
    $pet = dashPet($user);
    $recipe = dashRecipe($user);
    $pet->recipes()->attach($recipe->id);
    Subscription::create(['user_id' => $user->id, 'pet_id' => $pet->id, 'duration_days' => 14, 'status' => 'active', 'start_date' => Carbon::today()]);

    $this->actingAs($user)->getJson('/api/dashboard')->assertJsonPath('data.progress.next_step', 'complete');
});

test('has_address needs street, city and zipcode', function () {
    $user = User::factory()->create(['street' => 'Rua A', 'city' => 'SP', 'zipcode' => '01000000']);

    $this->actingAs($user)->getJson('/api/dashboard')->assertJsonPath('data.progress.has_address', true);

    $user->update(['zipcode' => null]);
    $this->actingAs($user->fresh())->getJson('/api/dashboard')->assertJsonPath('data.progress.has_address', false);
});

test('pending invoices are listed soonest first and cancelled orders are ignored', function () {
    $user = User::factory()->create();
    $later = Order::create(['user_id' => $user->id, 'total_price' => 20, 'status' => 'pending_payment']);
    $sooner = Order::create(['user_id' => $user->id, 'total_price' => 10, 'status' => 'pending_payment']);
    $cancelled = Order::create(['user_id' => $user->id, 'total_price' => 5, 'status' => 'cancelled']);
    Invoice::create(['order_id' => $later->id, 'user_id' => $user->id, 'amount' => 20, 'status' => 'pending', 'due_date' => Carbon::today()->addDays(5)]);
    Invoice::create(['order_id' => $sooner->id, 'user_id' => $user->id, 'amount' => 10, 'status' => 'pending', 'due_date' => Carbon::today()->addDay()]);
    Invoice::create(['order_id' => $cancelled->id, 'user_id' => $user->id, 'amount' => 5, 'status' => 'pending', 'due_date' => Carbon::today()]);

    $invoices = $this->actingAs($user)->getJson('/api/dashboard')->json('data.alerts.pending_invoices');

    expect(collect($invoices)->pluck('order_id')->all())->toBe([$sooner->id, $later->id]);
});

test('a vaccine is overdue only when its latest record is past due', function () {
    $user = User::factory()->create();
    $pet = dashPet($user);
    // Old dose, overdue — but renewed afterwards, so it must NOT be reported.
    $pet->vaccines()->create(['name' => 'V10', 'application_date' => '2024-01-01', 'next_due_date' => '2025-01-01']);
    $pet->vaccines()->create(['name' => 'v10', 'application_date' => '2025-01-02', 'next_due_date' => Carbon::today()->addYear()->toDateString()]);
    // Genuinely overdue.
    $pet->vaccines()->create(['name' => 'Rabies', 'application_date' => '2024-06-01', 'next_due_date' => '2025-06-01']);

    $overdue = $this->actingAs($user)->getJson('/api/dashboard')->json('data.alerts.overdue_vaccines');

    expect($overdue)->toHaveCount(1)
        ->and($overdue[0]['vaccine_name'])->toBe('Rabies')
        ->and($overdue[0]['pet_id'])->toBe($pet->id);
});

test('pets with missing profile fields are reported with the missing keys', function () {
    $user = User::factory()->create();
    $complete = dashPet($user, ['name' => 'Complete']);
    $incomplete = dashPet($user, ['name' => 'Partial', 'sex' => null, 'neutered' => null, 'breed' => '']);

    $incompletePets = $this->actingAs($user)->getJson('/api/dashboard')->json('data.alerts.incomplete_pets');

    expect($incompletePets)->toHaveCount(1)
        ->and($incompletePets[0]['pet_id'])->toBe($incomplete->id)
        ->and($incompletePets[0]['missing'])->toBe(['sex', 'neutered', 'breed'])
        ->and(collect($incompletePets)->pluck('pet_id')->contains($complete->id))->toBeFalse();
});

test('a neutered=false pet is not reported as missing that field', function () {
    $user = User::factory()->create();
    dashPet($user, ['neutered' => false]);

    $this->actingAs($user)->getJson('/api/dashboard')->assertJsonCount(0, 'data.alerts.incomplete_pets');
});

test('the current order is the newest one still in flight', function () {
    $user = User::factory()->create();
    Order::create(['user_id' => $user->id, 'total_price' => 1, 'status' => 'delivered']);
    $open = Order::create(['user_id' => $user->id, 'total_price' => 2, 'status' => 'in_production']);

    $this->actingAs($user)->getJson('/api/dashboard')
        ->assertJsonPath('data.current_order.id', $open->id)
        ->assertJsonPath('data.current_order.status', 'in_production');
});

test('the active subscription is the running plan with its week and recipes', function () {
    $user = User::factory()->create();
    $pet = dashPet($user);
    $recipe = dashRecipe($user);
    Subscription::create(['user_id' => $user->id, 'pet_id' => $pet->id, 'duration_days' => 14, 'status' => 'paused', 'start_date' => Carbon::today()->subDays(2)]);
    $plan = Subscription::create(['user_id' => $user->id, 'pet_id' => $pet->id, 'duration_days' => 21, 'status' => 'active', 'start_date' => Carbon::today()->subDays(9)]);
    $plan->recipes()->attach($recipe->id, ['position' => 0]);

    $this->actingAs($user)->getJson('/api/dashboard')
        ->assertJsonPath('data.active_subscription.id', $plan->id)
        ->assertJsonPath('data.active_subscription.current_cycle_index', 1)
        ->assertJsonPath('data.active_subscription.total_cycles', 3)
        ->assertJsonPath('data.active_subscription.pet.name', 'Rex');
});

test('pets list their own recipes only, never catalog templates', function () {
    $user = User::factory()->create();
    $pet = dashPet($user);
    $own = dashRecipe($user, 'Mine');
    $template = Recipe::create(['name' => 'Template', 'pet_type' => 'dog', 'is_template' => true]);
    $pet->recipes()->attach([$own->id, $template->id]);

    $recipes = $this->actingAs($user)->getJson('/api/dashboard')->json('data.pets.0.recipes');

    expect(collect($recipes)->pluck('name')->all())->toBe(['Mine']);
});

test('recent orders are capped at five, newest first, with item counts', function () {
    $user = User::factory()->create();
    foreach (range(1, 7) as $i) {
        Order::create(['user_id' => $user->id, 'total_price' => $i, 'status' => 'delivered']);
    }

    $orders = $this->actingAs($user)->getJson('/api/dashboard')->json('data.recent_orders');

    expect($orders)->toHaveCount(5)
        ->and((float) $orders[0]['total_price'])->toBe(7.0)
        ->and($orders[0])->toHaveKeys(['id', 'status', 'items_count', 'invoice_status', 'created_at']);
});

test('the dashboard never leaks another customer\'s data', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    dashPet($other, ['name' => 'Stranger']);
    Order::create(['user_id' => $other->id, 'total_price' => 99, 'status' => 'pending_payment']);

    $this->actingAs($user)->getJson('/api/dashboard')
        ->assertJsonCount(0, 'data.pets')
        ->assertJsonCount(0, 'data.recent_orders')
        ->assertJsonPath('data.current_order', null);
});

test('the guide can be dismissed and restored', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/api/onboarding/dismiss')->assertStatus(200)->assertJsonPath('data.onboarding_dismissed', true);
    expect($user->fresh()->onboarding_dismissed_at)->not->toBeNull();
    $this->actingAs($user)->getJson('/api/dashboard')->assertJsonPath('data.onboarding_dismissed', true);

    $this->actingAs($user)->deleteJson('/api/onboarding/dismiss')->assertStatus(200)->assertJsonPath('data.onboarding_dismissed', false);
    expect($user->fresh()->onboarding_dismissed_at)->toBeNull();
});

test('onboarding_dismissed_at cannot be set through profile update', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->putJson('/api/profile', [
        'name' => $user->name,
        'email' => $user->email,
        'onboarding_dismissed_at' => now()->toDateTimeString(),
    ])->assertStatus(200);

    expect($user->fresh()->onboarding_dismissed_at)->toBeNull();
});

test('dashboard endpoints require authentication', function () {
    $this->getJson('/api/dashboard')->assertStatus(401);
    $this->postJson('/api/onboarding/dismiss')->assertStatus(401);
});

test('the dashboard costs a constant number of queries however much data exists', function () {
    $user = User::factory()->create();
    $ingredient = Ingredient::create(['name' => 'Frango', 'unit' => 'kg', 'cost_per_unit' => 10, 'loss_rate' => 1, 'difficulty_multiplier' => 1]);

    $seed = function (int $count) use ($user, $ingredient): void {
        foreach (range(1, $count) as $i) {
            $pet = dashPet($user, ['name' => "Pet {$i}"]);
            $recipe = dashRecipe($user, "Recipe {$i}");
            $recipe->ingredients()->attach($ingredient->id, ['quantity' => 1, 'unit' => 'kg']);
            $pet->recipes()->attach($recipe->id);
            $pet->vaccines()->create(['name' => "V{$i}", 'application_date' => '2024-01-01', 'next_due_date' => '2024-06-01']);
            $order = Order::create(['user_id' => $user->id, 'total_price' => 10, 'status' => 'pending_payment']);
            Invoice::create(['order_id' => $order->id, 'user_id' => $user->id, 'amount' => 10, 'status' => 'pending', 'due_date' => Carbon::today()]);
        }
    };

    $count = function () use ($user): int {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->actingAs($user)->getJson('/api/dashboard')->assertStatus(200);
        $queries = count(DB::getQueryLog());
        DB::disableQueryLog();

        return $queries;
    };

    $seed(2);
    $count(); // warm-up
    $small = $count();
    $seed(6);

    expect($count())->toBe($small);
});
