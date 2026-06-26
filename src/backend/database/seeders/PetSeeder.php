<?php

namespace Database\Seeders;

use App\Models\Pet;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customer = User::where('email', 'cliente@goodfood.com')->first();

        if ($customer) {
            Pet::firstOrCreate([
                'user_id' => $customer->id,
                'name' => 'Rex',
            ], [
                'breed' => 'Golden Retriever',
                'weight' => 30.5,
                'age' => 48,
                'restrictions' => 'Alergia a frango',
            ]);

            Pet::firstOrCreate([
                'user_id' => $customer->id,
                'name' => 'Luna',
            ], [
                'breed' => 'Poodle',
                'weight' => 8.2,
                'age' => 24,
                'restrictions' => null,
            ]);
        }
    }
}
