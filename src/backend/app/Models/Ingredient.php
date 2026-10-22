<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'description',
        'unit',
        'unit_cost',
        'cost_per_unit',
        'loss_rate',
        'difficulty_multiplier',
        'stock_quantity',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'unit_cost' => 'decimal:3',
            'cost_per_unit' => 'decimal:3',
            'loss_rate' => 'decimal:3',
            'difficulty_multiplier' => 'decimal:3',
            'is_active' => 'boolean',
        ];
    }

    public function recipes()
    {
        return $this->belongsToMany(Recipe::class)
            ->withPivot('quantity')
            ->withTimestamps();
    }

    /**
     * Convert a quantity to kilograms for weight rules (g/ml -> /1000,
     * kg/l -> 1:1, unit -> 0.1 kg; unknown units weigh nothing).
     */
    public static function weightInKg(float $quantity, string $unit): float
    {
        return match (strtolower($unit)) {
            'g', 'ml' => $quantity / 1000,
            'kg', 'l' => $quantity,
            'unit' => $quantity * 0.1,
            default => 0.0,
        };
    }
}
