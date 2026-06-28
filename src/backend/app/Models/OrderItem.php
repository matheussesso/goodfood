<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents a single recipe line inside an order.
 *
 * @property int $id
 * @property int $order_id
 * @property int $recipe_id
 * @property float $unit_price
 * @property int $quantity
 */
class OrderItem extends Model
{
    use HasFactory;

    /** @var array<int, string> */
    protected $fillable = [
        'order_id',
        'recipe_id',
        'unit_price',
        'quantity',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'unit_price' => 'decimal:2',
        'quantity' => 'integer',
    ];

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
}
