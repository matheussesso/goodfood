<?php

declare(strict_types=1);

namespace App\Models;

use App\Services\RecipeCostCalculatorService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recipe extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'pet_id',
        'name',
        'description',
        'pet_type',
        'duration_days',
        'daily_portions',
        'instructions',
        'is_template',
        'frequency',
        'base_cost',
        'ingredient_cost',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_template' => 'boolean',
            'base_cost' => 'decimal:2',
            'ingredient_cost' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    public function pets(): BelongsToMany
    {
        return $this->belongsToMany(Pet::class)->withTimestamps();
    }

    public function ingredients(): BelongsToMany
    {
        return $this->belongsToMany(Ingredient::class)
            ->withPivot('quantity', 'unit')
            ->withTimestamps();
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function scopeTemplates($query)
    {
        return $query->where('is_template', true);
    }

    public function scopeForPetType($query, string $petType)
    {
        if (in_array($petType, ['dog', 'cat'], true)) {
            return $query->whereIn('pet_type', [$petType, 'all']);
        }

        return $query->where('pet_type', $petType);
    }

    /**
     * Run the cost calculator and return the full result array, always
     * pricing against the recipe's currently loaded ingredients (and thus
     * today's ingredient prices) — never a cached value.
     *
     * @param  int|null  $durationOverride  Duration in days to price for, instead of the
     *                                      recipe's own `duration_days` (e.g. 7 for a single
     *                                      subscription cycle, regardless of the recipe's
     *                                      native duration).
     * @return array{estimatedCost: float, ingredientCost: float, costPerKg: float, costBreakdown: array}
     */
    public function calculateCostResult(?int $durationOverride = null): array
    {
        if ($this->ingredients->isEmpty()) {
            return ['estimatedCost' => 0.0, 'ingredientCost' => 0.0, 'costPerKg' => 0.0, 'costBreakdown' => []];
        }

        $costCalculator = app(RecipeCostCalculatorService::class);

        $selectedIngredients = $this->ingredients->map(fn ($ingredient) => [
            'ingredient_id' => $ingredient->id,
            'quantity' => $ingredient->pivot->quantity ?? 0,
            'unit' => $ingredient->pivot->unit ?? $ingredient->unit,
        ])->toArray();

        return $costCalculator->calculateCost(
            $selectedIngredients,
            $durationOverride ?? intval($this->duration_days ?: 1),
            intval($this->daily_portions ?: 1)
        );
    }

    /**
     * @param  int|null  $durationOverride  See {@see calculateCostResult()}.
     */
    public function calculateTotalCost(?int $durationOverride = null): float
    {
        return (float) $this->calculateCostResult($durationOverride)['estimatedCost'];
    }

    public function updateBaseCost(): void
    {
        $this->load('ingredients');
        $result = $this->calculateCostResult();
        $this->base_cost = $result['estimatedCost'];
        $this->ingredient_cost = $result['ingredientCost'];
        $this->save();
    }
}
