<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Represents an auto-replenishment subscription for a pet, cycling through an
 * ordered rotation of recipes every `interval_days` days.
 *
 * @property int $id
 * @property int $user_id
 * @property int $pet_id
 * @property int $interval_days Days between cycles (multiple of 7, minimum 14)
 * @property string $status active|paused|cancelled
 * @property string $start_date
 * @property string|null $next_delivery_date
 * @property int|null $orders_count Appended via withCount()
 * @property string|null $orders_max_created_at Appended via withMax()
 */
class Subscription extends Model
{
    use HasFactory;

    /** @var array<int, string> */
    protected $fillable = [
        'user_id',
        'pet_id',
        'interval_days',
        'status',
        'start_date',
        'next_delivery_date',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'start_date' => 'date',
        'next_delivery_date' => 'date',
        'interval_days' => 'integer',
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

    /**
     * The ordered rotation of recipes this subscription cycles through.
     *
     * @return BelongsToMany<Recipe, $this>
     */
    public function recipes(): BelongsToMany
    {
        return $this->belongsToMany(Recipe::class, 'subscription_recipes')
            ->withPivot('position')
            ->orderBy('subscription_recipes.position')
            ->withTimestamps();
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Compute which cycle (0-indexed) the subscription is currently on, based on
     * how many `interval_days` periods have elapsed since the first delivery.
     */
    public function currentCycleIndex(): int
    {
        if (! $this->next_delivery_date || ! $this->start_date || $this->interval_days <= 0) {
            return 0;
        }

        $firstDelivery = $this->start_date->copy()->addDays($this->interval_days);
        $elapsedDays = $firstDelivery->diffInDays($this->next_delivery_date, false);

        return max(0, (int) floor($elapsedDays / $this->interval_days));
    }

    /**
     * Resolve the recipe assigned to a given cycle, wrapping around the rotation.
     */
    public function recipeForCycle(int $cycleIndex): ?Recipe
    {
        if (! $this->relationLoaded('recipes') || $this->recipes->isEmpty()) {
            return null;
        }

        return $this->recipes->get($cycleIndex % $this->recipes->count());
    }

    /**
     * Compute the live estimated price of the next scheduled recipe in the rotation.
     * Returns 0 if recipes are not loaded or the rotation is empty.
     */
    public function getEstimatedPriceAttribute(): float
    {
        $recipe = $this->recipeForCycle($this->currentCycleIndex());

        if (! $recipe) {
            return 0.0;
        }

        return (float) $recipe->calculateTotalCost();
    }
}
