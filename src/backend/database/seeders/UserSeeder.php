<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
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
            'address' => 'Rua das Flores, 123',
            'city' => 'São Paulo',
            'state' => 'SP',
            'zipcode' => '01000-000',
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
