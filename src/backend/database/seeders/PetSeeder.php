<?php

namespace Database\Seeders;

use App\Models\Pet;
use App\Models\User;
use Illuminate\Database\Seeder;

class PetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $joao = User::where('email', 'cliente@goodfood.com')->first();

        if ($joao) {
            Pet::firstOrCreate(['user_id' => $joao->id, 'name' => 'Rex'], [
                'type' => 'dog',
                'breed' => 'Golden Retriever',
                'weight' => 30.5,
                'age' => 48,
                'restrictions' => 'Alergia a frango',
                'allergies' => 'Frango',
                'special_needs' => null,
            ]);

            Pet::firstOrCreate(['user_id' => $joao->id, 'name' => 'Luna'], [
                'type' => 'dog',
                'breed' => 'Poodle',
                'weight' => 8.2,
                'age' => 24,
                'restrictions' => null,
                'allergies' => null,
                'special_needs' => null,
            ]);
        }

        $maria = User::where('email', 'maria@goodfood.com')->first();

        if ($maria) {
            Pet::firstOrCreate(['user_id' => $maria->id, 'name' => 'Bella'], [
                'type' => 'dog',
                'breed' => 'Labrador Retriever',
                'weight' => 25.0,
                'age' => 36,
                'restrictions' => null,
                'allergies' => null,
                'special_needs' => null,
            ]);

            Pet::firstOrCreate(['user_id' => $maria->id, 'name' => 'Nemo'], [
                'type' => 'cat',
                'breed' => 'Siamês',
                'weight' => 4.3,
                'age' => 18,
                'restrictions' => 'Sensível a grãos',
                'allergies' => 'Glúten',
                'special_needs' => 'Dieta hipoalergênica',
            ]);
        }

        $pedro = User::where('email', 'pedro@goodfood.com')->first();

        if ($pedro) {
            Pet::firstOrCreate(['user_id' => $pedro->id, 'name' => 'Max'], [
                'type' => 'dog',
                'breed' => 'Bulldog Francês',
                'weight' => 12.0,
                'age' => 30,
                'restrictions' => 'Problemas respiratórios',
                'allergies' => null,
                'special_needs' => 'Porções menores, 3x ao dia',
            ]);
        }

        $ana = User::where('email', 'ana@goodfood.com')->first();

        if ($ana) {
            Pet::firstOrCreate(['user_id' => $ana->id, 'name' => 'Mia'], [
                'type' => 'dog',
                'breed' => 'Shih Tzu',
                'weight' => 5.8,
                'age' => 60,
                'restrictions' => null,
                'allergies' => null,
                'special_needs' => 'Idosa, ração ortopédica recomendada',
            ]);

            Pet::firstOrCreate(['user_id' => $ana->id, 'name' => 'Simba'], [
                'type' => 'cat',
                'breed' => 'Persa',
                'weight' => 6.1,
                'age' => 42,
                'restrictions' => 'Intolerante a lactose',
                'allergies' => 'Lactose',
                'special_needs' => null,
            ]);
        }
    }
}
