<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Represents an auto-replenishment subscription for a specific pet + recipe combination.
 *
 * @property int         $id
 * @property int         $user_id
 * @property int         $pet_id
 * @property int         $recipe_id
 * @property string      $frequency     weekly|biweekly|monthly
 * @property string      $status        active|paused|cancelled
 * @property string      $start_date
 * @property string|null $next_delivery_date
 * @property int|null    $orders_count          Appended via withCount()
 * @property string|null $orders_max_created_at Appended via withMax()
 */
class Subscription extends Model
{
    use HasFactory;

    /** @var array<int, string> */
    protected $fillable = [
        'user_id',
        'pet_id',
        'recipe_id',
        'frequency',
        'status',
        'start_date',
        'next_delivery_date',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'start_date'         => 'date',
        'next_delivery_date' => 'date',
    ];

    /** @var array<int, string> */
    protected $appends = ['estimated_price'];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Pet, $this> */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    /** @return BelongsTo<Recipe, $this> */
    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Compute the live estimated price for this subscription's recipe.
     * Returns 0 if recipe or ingredients are not loaded.
     *
     * @return float
     */
    public function getEstimatedPriceAttribute(): float
    {
        if (!$this->relationLoaded('recipe') || !$this->recipe) {
            return 0.0;
        }

        return (float) $this->recipe->calculateTotalCost();
    }
}
