<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\OrderItem;
use App\Models\Pet;
use App\Models\Recipe;
use App\Models\User;
use App\Services\OrderService;
use App\Services\RecipeService;
use Illuminate\Database\Seeder;

/**
 * Seeds a sample meal plan order for the demo customer: two recipes in
 * sequence for the first pet and a single recipe for the second one.
 */
class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(OrderService $orders, RecipeService $recipes): void
    {
        $customer = User::where('email', 'cliente@goodfood.com')->first();
        if (! $customer || $customer->orders()->exists()) {
            return;
        }

        $pets = $customer->pets()->with('recipes.ingredients')->orderBy('id')->get()
            ->filter(fn (Pet $pet) => $pet->recipes->isNotEmpty());
        if ($pets->isEmpty()) {
            return;
        }

        $first = $pets->first();
        $secondTemplate = Recipe::templates()->with('ingredients')->orderBy('id')->skip(1)->first();
        if ($first->recipes->count() < 2 && $secondTemplate) {
            $recipes->copyToPet($secondTemplate, $first);
            $first->load('recipes.ingredients');
        }

        $items = $first->recipes->take(2)->map(fn (Recipe $recipe) => $this->item($first, $recipe, 15));
        foreach ($pets->skip(1)->take(1) as $pet) {
            $items->push($this->item($pet, $pet->recipes->first(), 30));
        }

        $orders->place($customer, $items->values()->all(), 'Rua das Flores, 123');
    }

    /**
     * Build an order item, stretching the duration when the recipe needs more
     * days to reach the minimum weight.
     *
     * @return array{pet_id: int, recipe_id: int, duration_days: int}
     */
    private function item(Pet $pet, Recipe $recipe, int $days): array
    {
        return [
            'pet_id' => $pet->id,
            'recipe_id' => $recipe->id,
            'duration_days' => max($days, OrderItem::minimumDurationDaysFor($recipe)),
        ];
    }
}
