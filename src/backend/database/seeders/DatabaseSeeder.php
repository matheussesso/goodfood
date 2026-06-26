<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            PetSeeder::class,
            IngredientSeeder::class,
            GeneralSettingSeeder::class,
            RecipeSeeder::class,
            SubscriptionSeeder::class,
            OrderSeeder::class,
        ]);
    }
}
