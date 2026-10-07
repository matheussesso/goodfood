<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\Recipe;
use Illuminate\Database\Seeder;

class RecipeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ingFrango = Ingredient::where('name', 'Peito de Frango')->first();
        $ingCarne = Ingredient::where('name', 'Carne Moída (Patinho)')->first();
        $ingArroz = Ingredient::where('name', 'Arroz Integral')->first();
        $ingCenoura = Ingredient::where('name', 'Cenoura (c/ casca)')->first();
        $ingBatata = Ingredient::where('name', 'Batata Doce')->first();
        $ingOleo = Ingredient::where('name', 'Óleo de Coco')->first();

        if ($ingFrango && $ingArroz && $ingCenoura && $ingOleo) {
            $recipeFrango = Recipe::firstOrCreate(['name' => 'Mix Frango e Legumes'], [
                'description' => 'Dieta balanceada com base em frango, arroz e cenoura.',
                'pet_type' => 'all',
                'duration_days' => 15,
                'daily_portions' => 2,
                'is_template' => true,
                'is_active' => true,
            ]);

            $recipeFrango->ingredients()->syncWithoutDetaching([
                $ingFrango->id => ['quantity' => 250, 'unit' => 'g'],
                $ingArroz->id => ['quantity' => 150, 'unit' => 'g'],
                $ingCenoura->id => ['quantity' => 80, 'unit' => 'g'],
                $ingOleo->id => ['quantity' => 20, 'unit' => 'ml'],
            ]);
        }

        if ($ingCarne && $ingBatata && $ingOleo) {
            $recipeCarne = Recipe::firstOrCreate(['name' => 'Mix Carne Premium'], [
                'description' => 'Alta proteína com carne bovina e batata doce. Sem frango.',
                'pet_type' => 'all',
                'duration_days' => 15,
                'daily_portions' => 2,
                'is_template' => true,
                'is_active' => true,
            ]);

            $recipeCarne->ingredients()->syncWithoutDetaching([
                $ingCarne->id => ['quantity' => 300, 'unit' => 'g'],
                $ingBatata->id => ['quantity' => 180, 'unit' => 'g'],
                $ingOleo->id => ['quantity' => 20, 'unit' => 'ml'],
            ]);
        }
    }
}
