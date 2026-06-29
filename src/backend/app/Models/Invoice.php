<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents a payment invoice linked to a customer order.
 *
 * @property int         $id
 * @property int         $order_id
 * @property int         $user_id
 * @property float       $amount
 * @property string      $status        pending|paid|failed|cancelled
 * @property string|null $due_date
 * @property string|null $paid_at
 * @property string|null $payment_method
 * @property string|null $reference
 */
class Invoice extends Model
{
    use HasFactory;

    /** @var array<int, string> */
    protected $fillable = [
        'order_id',
        'user_id',
        'amount',
        'status',
        'due_date',
        'paid_at',
        'payment_method',
        'reference',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'amount'  => 'decimal:2',
        'due_date' => 'date',
        'paid_at'  => 'datetime',
    ];

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
