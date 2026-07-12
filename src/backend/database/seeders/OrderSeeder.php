<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Pet;
use App\Models\Recipe;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customer = User::where('email', 'cliente@goodfood.com')->first();
        if (! $customer) {
            return;
        }

        $pet1 = Pet::where('name', 'Rex')->where('user_id', $customer->id)->first();
        $pet2 = Pet::where('name', 'Luna')->where('user_id', $customer->id)->first();

        $recipeFrango = Recipe::where('name', 'Mix Frango e Legumes')->first();
        $recipeCarne = Recipe::where('name', 'Mix Carne Premium')->first();

        if ($pet2 && $recipeFrango) {
            Order::firstOrCreate([
                'user_id' => $customer->id,
                'pet_id' => $pet2->id,
                'recipe_id' => $recipeFrango->id,
            ], [
                'total_price' => 50.00, // 2 portions
                'status' => 'pending',
                'delivery_address' => 'Rua das Flores, 123',
                'delivery_date' => Carbon::now()->addDays(1)->toDateString(),
            ]);
        }

        if ($pet1 && $recipeCarne) {
            Order::firstOrCreate([
                'user_id' => $customer->id,
                'pet_id' => $pet1->id,
                'recipe_id' => $recipeCarne->id,
            ], [
                'total_price' => 32.00,
                'status' => 'in_production',
                'delivery_address' => 'Rua das Flores, 123',
                'delivery_date' => Carbon::now()->toDateString(),
            ]);
        }
    }
}
