<?php

declare(strict_types=1);

namespace App\Http\Requests\Recipe;

use App\Models\Ingredient;
use App\Models\Recipe;
use Illuminate\Validation\Validator;

/**
 * Shared "minimum total weight" rule for customer-authored recipes.
 *
 * A recipe must contain at least {@see Recipe::MIN_TOTAL_WEIGHT_KG} kg of ingredients
 * across its whole duration (daily weight x duration_days). The same rule is
 * enforced in the UI; this keeps the API from accepting what the form rejects.
 * Admins are exempt (they author catalog templates).
 */
trait ValidatesMinimumRecipeWeight
{
    /** Duration assumed when the payload omits `duration_days` (matches the form default). */
    private const DEFAULT_DURATION_DAYS = 15;

    /**
     * Register the after-validation hook enforcing the minimum weight.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->user()->isAdmin() || $validator->errors()->isNotEmpty()) {
                return;
            }

            $prefix = $this->recipeInputPrefix();
            $items = (array) $this->input($prefix.'ingredients', []);
            if ($items === []) {
                return;
            }

            $duration = (int) ($this->input($prefix.'duration_days') ?: $this->currentDurationDays());
            $totalKg = $this->dailyWeightKg($items) * $duration;

            if ($totalKg < Recipe::MIN_TOTAL_WEIGHT_KG) {
                $validator->errors()->add(
                    $prefix.'ingredients',
                    'The recipe must contain at least '.Recipe::MIN_TOTAL_WEIGHT_KG.' kg of ingredients in total.'
                );
            }
        });
    }

    /**
     * Prefix of the recipe fields in the payload ("" when the recipe is the
     * payload itself, "recipe." when it is nested, e.g. when creating a pet).
     */
    protected function recipeInputPrefix(): string
    {
        return '';
    }

    /**
     * Duration to fall back on when the request does not send one.
     */
    protected function currentDurationDays(): int
    {
        return self::DEFAULT_DURATION_DAYS;
    }

    /**
     * Daily ingredient weight in kg, see {@see Ingredient::weightInKg()}.
     *
     * @param  array<int, array{id?: int|string, quantity?: mixed, unit?: string|null}>  $items
     */
    private function dailyWeightKg(array $items): float
    {
        $units = Ingredient::whereIn('id', collect($items)->pluck('id')->filter())->pluck('unit', 'id');

        return (float) collect($items)->sum(fn (array $item): float => Ingredient::weightInKg(
            (float) ($item['quantity'] ?? 0),
            (string) ($item['unit'] ?? $units->get($item['id'] ?? 0, 'kg')),
        ));
    }
}
