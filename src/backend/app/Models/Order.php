<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'pet_id',
        'recipe_id',
        'subscription_id',
        'total_price',
        'status',
        'delivery_address',
        'delivery_date',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'delivery_date' => 'date',
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

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }
}
