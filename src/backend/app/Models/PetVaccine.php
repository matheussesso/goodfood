<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents a single vaccination record for a pet.
 *
 * @property int $id
 * @property int $pet_id
 * @property string $name
 * @property string $application_date
 * @property string|null $next_due_date
 */
class PetVaccine extends Model
{
    /** @var array<int, string> */
    protected $fillable = [
        'pet_id',
        'name',
        'application_date',
        'next_due_date',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'application_date' => 'date',
        'next_due_date' => 'date',
    ];

    /** @return BelongsTo<Pet, $this> */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }
}
