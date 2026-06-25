<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'weight_per_portion',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'weight_per_portion' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class)
            ->withPivot('quantity')
            ->withTimestamps();
    }
}
