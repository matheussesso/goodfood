<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Represents a customer order, which may contain one or more recipe items.
 *
 * @property int $id
 * @property int $user_id
 * @property int|null $pet_id
 * @property int|null $recipe_id
 * @property int|null $subscription_id
 * @property float $total_price
 * @property string $status
 * @property string|null $delivery_address
 * @property string|null $delivery_date
 */
class Order extends Model
{
    use HasFactory;

    /** @var array<int, string> */
    protected $fillable = [
        'user_id',
        'pet_id',
        'recipe_id',
        'subscription_id',
        'total_price',
        'status',
        'delivery_address',
        'delivery_date',
        'scheduled_reposicao_date',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'total_price' => 'decimal:2',
        'delivery_date' => 'date',
        'scheduled_reposicao_date' => 'string',
    ];

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

    /** @return BelongsTo<Subscription, $this> */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    /** @return HasMany<OrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** @return HasOne<Invoice, $this> */
    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }
}
