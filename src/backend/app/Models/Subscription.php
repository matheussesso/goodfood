<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Represents a fixed-duration weekly meal plan for a pet: exactly one recipe
 * per 7-day block (`duration_days / 7` blocks total). Has no runtime effect
 * on Order — it is a standalone saved plan, not an auto-replenishment engine.
 *
 * @property int $id
 * @property int $user_id
 * @property int $pet_id
 * @property int $duration_days Total plan length in days (multiple of 7, minimum 14)
 * @property string $status active|paused|cancelled
 * @property string $start_date
 * @property float $estimated_price Appended: total cost of every recipe in the plan
 * @property int $total_cycles Appended: duration_days / 7
 * @property int|null $current_cycle_index Appended: 0-indexed current week, or null if not started/already ended
 */
class Subscription extends Model
{
    use HasFactory;

    /** @var array<int, string> */
    protected $fillable = [
        'user_id',
        'pet_id',
        'duration_days',
        'status',
        'start_date',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'start_date' => 'date',
        'duration_days' => 'integer',
    ];

    /** @var array<int, string> */
    protected $appends = ['estimated_price', 'total_cycles', 'current_cycle_index'];

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
     * The plan's weekly recipes, one per 7-day block, ordered by position (week index).
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

    /**
     * Total number of 7-day blocks in this plan.
     */
    public function getTotalCyclesAttribute(): int
    {
        return intdiv($this->duration_days, 7);
    }

    /**
     * Display-only: which 0-indexed week the plan is currently on, based on
     * elapsed days since `start_date`. Null if the plan hasn't started yet or
     * has already run past its total duration.
     */
    public function getCurrentCycleIndexAttribute(): ?int
    {
        if (! $this->start_date || $this->duration_days <= 0) {
            return null;
        }

        $daysElapsed = $this->start_date->diffInDays(now(), false);

        if ($daysElapsed < 0 || $daysElapsed >= $this->duration_days) {
            return null;
        }

        return min($this->total_cycles - 1, intdiv((int) $daysElapsed, 7));
    }

    /**
     * Resolve the recipe assigned to a given week (0-indexed), if any.
     */
    public function recipeForCycle(int $cycleIndex): ?Recipe
    {
        if (! $this->relationLoaded('recipes') || $this->recipes->isEmpty()) {
            return null;
        }

        return $this->recipes->get($cycleIndex);
    }

    /**
     * Total cost of the plan: the sum of every recipe's cost across all weeks.
     * Returns 0 if recipes are not loaded or the plan has no recipes.
     */
    public function getEstimatedPriceAttribute(): float
    {
        if (! $this->relationLoaded('recipes')) {
            return 0.0;
        }

        return (float) $this->recipes->sum(fn (Recipe $recipe) => $recipe->calculateTotalCost());
    }
}
