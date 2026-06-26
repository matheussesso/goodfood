<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\Recipe;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RecipeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ingFrango = Ingredient::where('name', 'Peito de Frango')->first();
        $ingCarne = Ingredient::where('name', 'Carne Bovina (Patinho)')->first();
        $ingArroz = Ingredient::where('name', 'Arroz Integral')->first();
        $ingCenoura = Ingredient::where('name', 'Cenoura')->first();
        $ingBatata = Ingredient::where('name', 'Batata Doce')->first();
        $ingOleo = Ingredient::where('name', 'Óleo de Coco')->first();

        if ($ingFrango && $ingArroz && $ingCenoura && $ingOleo) {
            $recipeFrango = Recipe::firstOrCreate(['name' => 'Mix Frango e Legumes'], [
                'description' => 'Dieta balanceada com base em frango, arroz e cenoura.',
                'price' => 25.00,
                'weight_per_portion' => 0.50, // 500g
                'is_active' => true,
            ]);

            $recipeFrango->ingredients()->syncWithoutDetaching([
                $ingFrango->id => ['quantity' => 0.25],
                $ingArroz->id => ['quantity' => 0.15],
                $ingCenoura->id => ['quantity' => 0.08],
                $ingOleo->id => ['quantity' => 0.02],
            ]);
        }

        if ($ingCarne && $ingBatata && $ingOleo) {
            $recipeCarne = Recipe::firstOrCreate(['name' => 'Mix Carne Premium'], [
                'description' => 'Alta proteína com carne bovina e batata doce. Sem frango.',
                'price' => 32.00,
                'weight_per_portion' => 0.50, // 500g
                'is_active' => true,
            ]);

            $recipeCarne->ingredients()->syncWithoutDetaching([
                $ingCarne->id => ['quantity' => 0.30],
                $ingBatata->id => ['quantity' => 0.18],
                $ingOleo->id => ['quantity' => 0.02],
            ]);
        }
    }
}
