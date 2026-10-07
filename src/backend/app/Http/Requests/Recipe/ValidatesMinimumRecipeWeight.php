<?php

declare(strict_types=1);

namespace App\Http\Requests\Recipe;

use App\Models\Ingredient;
use Illuminate\Validation\Validator;

/**
 * Shared "minimum total weight" rule for customer-authored recipes.
 *
 * A recipe must contain at least {@see MIN_TOTAL_WEIGHT_KG} kg of ingredients
 * across its whole duration (daily weight x duration_days). The same rule is
 * enforced in the UI; this keeps the API from accepting what the form rejects.
 * Admins are exempt (they author catalog templates).
 */
trait ValidatesMinimumRecipeWeight
{
    /** Minimum total ingredient weight, in kg, for a customer recipe. */
    public const MIN_TOTAL_WEIGHT_KG = 1.5;

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

            $items = (array) $this->input('ingredients', []);
            if ($items === []) {
                return;
            }

            $duration = (int) ($this->input('duration_days') ?: $this->currentDurationDays());
            $totalKg = $this->dailyWeightKg($items) * $duration;

            if ($totalKg < self::MIN_TOTAL_WEIGHT_KG) {
                $validator->errors()->add(
                    'ingredients',
                    'The recipe must contain at least '.self::MIN_TOTAL_WEIGHT_KG.' kg of ingredients in total.'
                );
            }
        });
    }

    /**
     * Duration to fall back on when the request does not send one.
     */
    protected function currentDurationDays(): int
    {
        return self::DEFAULT_DURATION_DAYS;
    }

    /**
     * Daily ingredient weight in kg (g/ml -> /1000, kg/l -> 1:1, unit -> 0.1 kg).
     *
     * @param  array<int, array{id?: int|string, quantity?: mixed, unit?: string|null}>  $items
     */
    private function dailyWeightKg(array $items): float
    {
        $units = Ingredient::whereIn('id', collect($items)->pluck('id')->filter())->pluck('unit', 'id');

        return (float) collect($items)->sum(function (array $item) use ($units): float {
            $quantity = (float) ($item['quantity'] ?? 0);
            $unit = strtolower((string) ($item['unit'] ?? $units->get($item['id'] ?? 0, 'kg')));

            return match ($unit) {
                'g', 'ml' => $quantity / 1000,
                'kg', 'l' => $quantity,
                'unit' => $quantity * 0.1,
                default => 0.0,
            };
        });
    }
}
