<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'unit',
        'unit_cost',
        'stock_quantity',
        'is_active',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'stock_quantity' => 'integer',
        'is_active' => 'boolean',
    ];

    public function recipes()
    {
        return $this->belongsToMany(Recipe::class)
            ->withPivot('quantity')
            ->withTimestamps();
    }
}
