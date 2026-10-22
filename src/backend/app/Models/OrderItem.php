<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents one step of a pet's meal plan inside an order: a recipe fed
 * for `duration_days` days, at `position` in that pet's sequence.
 *
 * @property int $id
 * @property int $order_id
 * @property int|null $pet_id
 * @property int $recipe_id
 * @property int $duration_days
 * @property int $position
 * @property float $unit_price
 * @property int $quantity
 */
class OrderItem extends Model
{
    use HasFactory;

    /** Shortest duration, in days, a recipe can have inside a meal plan. */
    public const MIN_DURATION_DAYS = 7;

    /** Longest duration, in days, a recipe can have inside a meal plan. */
    public const MAX_DURATION_DAYS = 90;

    /** @var array<int, string> */
    protected $fillable = [
        'order_id',
        'pet_id',
        'recipe_id',
        'duration_days',
        'position',
        'unit_price',
        'quantity',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'unit_price' => 'decimal:2',
        'quantity' => 'integer',
        'duration_days' => 'integer',
        'position' => 'integer',
    ];

    /**
     * Shortest duration, in days, a recipe can have inside an order: the plan
     * minimum, raised until the recipe feeds {@see Recipe::MIN_TOTAL_WEIGHT_KG} kg.
     *
     * @param  Recipe  $recipe  Recipe with its ingredients loaded.
     */
    public static function minimumDurationDaysFor(Recipe $recipe): int
    {
        $dailyKg = $recipe->dailyWeightKg();
        if ($dailyKg <= 0) {
            return self::MIN_DURATION_DAYS;
        }

        return max(self::MIN_DURATION_DAYS, (int) ceil(round(Recipe::MIN_TOTAL_WEIGHT_KG / $dailyKg, 6)));
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<Recipe, $this> */
    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }

    /** @return BelongsTo<Pet, $this> */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }
}
