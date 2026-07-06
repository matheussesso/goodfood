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
}
