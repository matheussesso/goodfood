<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents a document attached to a pet (exam, prescription, report, other).
 *
 * @property int $id
 * @property int $pet_id
 * @property string $category exam|prescription|report|other
 * @property string $name
 * @property string $file_path
 */
class PetDocument extends Model
{
    /** @var array<int, string> */
    protected $fillable = [
        'pet_id',
        'category',
        'name',
        'file_path',
    ];

    /** @return BelongsTo<Pet, $this> */
    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }
}
