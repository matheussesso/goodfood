<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Class Pet
 *
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string|null $breed
 * @property float|null $weight
 * @property int|null $age
 * @property string|null $birth_date
 * @property string|null $restrictions
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 */
class Pet extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'type',
        'sex',
        'breed',
        'weight',
        'age',
        'birth_date',
        'restrictions',
        'allergies',
        'special_needs',
        'photo_url',
        'neutered',
        'microchip_number',
        'vet_name',
        'vet_phone',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'weight' => 'decimal:2',
        'age' => 'integer',
        'birth_date' => 'date',
        'neutered' => 'boolean',
    ];

    /**
     * Get the user that owns the pet.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function recipes()
    {
        return $this->belongsToMany(Recipe::class)->withTimestamps();
    }

    /** @return HasMany<PetVaccine, $this> */
    public function vaccines()
    {
        return $this->hasMany(PetVaccine::class)->orderByDesc('application_date');
    }

    /** @return HasMany<PetDocument, $this> */
    public function documents()
    {
        return $this->hasMany(PetDocument::class)->latest();
    }
}
