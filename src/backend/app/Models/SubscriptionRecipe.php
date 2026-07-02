<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pivot record linking a Subscription to one recipe at a given position in its rotation.
 *
 * @property int $id
 * @property int $subscription_id
 * @property int $recipe_id
 * @property int $position
 */
class SubscriptionRecipe extends Model
{
    /** @var array<int, string> */
    protected $fillable = [
        'subscription_id',
        'recipe_id',
        'position',
    ];

    /** @return BelongsTo<Subscription, $this> */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    /** @return BelongsTo<Recipe, $this> */
    public function recipe(): BelongsTo
    {
        return $this->belongsTo(Recipe::class);
    }
}
