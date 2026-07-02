<?php

namespace Database\Seeders;

use App\Models\Pet;
use App\Models\Recipe;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SubscriptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customer = User::where('email', 'cliente@goodfood.com')->first();
        if (!$customer) return;

        $pet1 = Pet::where('name', 'Rex')->where('user_id', $customer->id)->first();
        $recipeCarne = Recipe::where('name', 'Mix Carne Premium')->first();
        $recipeFrango = Recipe::where('name', '!=', 'Mix Carne Premium')->first();

        if (!$pet1 || !$recipeCarne) {
            return;
        }

        $startDate = Carbon::now()->addDays(2);
        $intervalDays = 14;

        $subscription = Subscription::firstOrCreate([
            'user_id' => $customer->id,
            'pet_id' => $pet1->id,
        ], [
            'interval_days' => $intervalDays,
            'status' => 'active',
            'start_date' => $startDate->toDateString(),
            'next_delivery_date' => $startDate->copy()->addDays($intervalDays)->toDateString(),
        ]);

        if ($subscription->recipes()->exists()) {
            return;
        }

        $subscription->recipes()->attach($recipeCarne->id, ['position' => 0]);
        if ($recipeFrango) {
            $subscription->recipes()->attach($recipeFrango->id, ['position' => 1]);
        }
    }
}
