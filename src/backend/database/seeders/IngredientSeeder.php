<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class IngredientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Ingredient::firstOrCreate(['name' => 'Peito de Frango'], ['unit' => 'kg', 'unit_cost' => 15.00, 'cost_per_unit' => 15.00, 'category' => 'Proteína', 'stock_quantity' => 100, 'is_active' => true]);
        Ingredient::firstOrCreate(['name' => 'Carne Bovina (Patinho)'], ['unit' => 'kg', 'unit_cost' => 35.00, 'cost_per_unit' => 35.00, 'category' => 'Proteína', 'stock_quantity' => 50, 'is_active' => true]);
        Ingredient::firstOrCreate(['name' => 'Arroz Integral'], ['unit' => 'kg', 'unit_cost' => 5.00, 'cost_per_unit' => 5.00, 'category' => 'Carboidrato', 'stock_quantity' => 200, 'is_active' => true]);
        Ingredient::firstOrCreate(['name' => 'Cenoura'], ['unit' => 'kg', 'unit_cost' => 4.50, 'cost_per_unit' => 4.50, 'category' => 'Vegetal', 'stock_quantity' => 80, 'is_active' => true]);
        Ingredient::firstOrCreate(['name' => 'Batata Doce'], ['unit' => 'kg', 'unit_cost' => 6.00, 'cost_per_unit' => 6.00, 'category' => 'Carboidrato', 'stock_quantity' => 120, 'is_active' => true]);
        Ingredient::firstOrCreate(['name' => 'Óleo de Coco'], ['unit' => 'l', 'unit_cost' => 40.00, 'cost_per_unit' => 40.00, 'category' => 'Gordura', 'stock_quantity' => 20, 'is_active' => true]);
    }
}
