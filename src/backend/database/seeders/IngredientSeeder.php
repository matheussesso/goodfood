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
        Ingredient::firstOrCreate(['name' => 'Peito de Frango'], ['unit' => 'kg', 'unit_cost' => 15.00, 'stock_quantity' => 100, 'is_active' => true]);
        Ingredient::firstOrCreate(['name' => 'Carne Bovina (Patinho)'], ['unit' => 'kg', 'unit_cost' => 35.00, 'stock_quantity' => 50, 'is_active' => true]);
        Ingredient::firstOrCreate(['name' => 'Arroz Integral'], ['unit' => 'kg', 'unit_cost' => 5.00, 'stock_quantity' => 200, 'is_active' => true]);
        Ingredient::firstOrCreate(['name' => 'Cenoura'], ['unit' => 'kg', 'unit_cost' => 4.50, 'stock_quantity' => 80, 'is_active' => true]);
        Ingredient::firstOrCreate(['name' => 'Batata Doce'], ['unit' => 'kg', 'unit_cost' => 6.00, 'stock_quantity' => 120, 'is_active' => true]);
        Ingredient::firstOrCreate(['name' => 'Óleo de Coco'], ['unit' => 'l', 'unit_cost' => 40.00, 'stock_quantity' => 20, 'is_active' => true]);
    }
}
