<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::firstOrCreate([
            'email' => 'admin@goodfood.com',
        ], [
            'name' => 'Admin GoodFood',
            'password' => Hash::make('12345678'),
            'role' => 'admin',
        ]);

        User::firstOrCreate([
            'email' => 'cliente@goodfood.com',
        ], [
            'name' => 'João Cliente',
            'password' => Hash::make('12345678'),
            'role' => 'customer',
            'phone' => '11999999999',
            'street' => 'Rua das Flores',
            'number' => '123',
            'complement' => 'Apto 45',
            'neighborhood' => 'Jardim Paulista',
            'city' => 'São Paulo',
            'state' => 'SP',
            'zipcode' => '01000-000',
        ]);

        User::firstOrCreate([
            'email' => 'maria@goodfood.com',
        ], [
            'name' => 'Maria Silva',
            'password' => Hash::make('12345678'),
            'role' => 'customer',
            'phone' => '11988888888',
            'street' => 'Av. Paulista',
            'number' => '1578',
            'complement' => 'Conjunto 32',
            'neighborhood' => 'Bela Vista',
            'city' => 'São Paulo',
            'state' => 'SP',
            'zipcode' => '01310-200',
        ]);

        User::firstOrCreate([
            'email' => 'pedro@goodfood.com',
        ], [
            'name' => 'Pedro Oliveira',
            'password' => Hash::make('12345678'),
            'role' => 'customer',
            'phone' => '21977777777',
            'street' => 'Rua Voluntários da Pátria',
            'number' => '340',
            'complement' => null,
            'neighborhood' => 'Botafogo',
            'city' => 'Rio de Janeiro',
            'state' => 'RJ',
            'zipcode' => '22270-010',
        ]);

        User::firstOrCreate([
            'email' => 'ana@goodfood.com',
        ], [
            'name' => 'Ana Costa',
            'password' => Hash::make('12345678'),
            'role' => 'customer',
            'phone' => '31966666666',
            'street' => 'Rua Sergipe',
            'number' => '675',
            'complement' => 'Casa',
            'neighborhood' => 'Funcionários',
            'city' => 'Belo Horizonte',
            'state' => 'MG',
            'zipcode' => '30130-171',
        ]);

        User::firstOrCreate([
            'email' => 'cozinha@goodfood.com',
        ], [
            'name' => 'Cozinha Central',
            'password' => Hash::make('12345678'),
            'role' => 'producer',
        ]);

        User::firstOrCreate([
            'email' => 'entregador@goodfood.com',
        ], [
            'name' => 'Carlos Entregador',
            'password' => Hash::make('12345678'),
            'role' => 'delivery',
        ]);
    }
}
