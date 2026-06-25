<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'pet_id',
        'recipe_id',
        'frequency',
        'status',
        'start_date',
        'next_delivery_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'next_delivery_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
