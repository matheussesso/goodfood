<?php

declare(strict_types=1);

namespace App\Http\Requests\Order;

use App\Models\OrderItem;
use App\Models\Recipe;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Validates the payload for creating an order. An order is a meal plan: each
 * item is a recipe of one of the customer's pets with how many days it lasts;
 * items of the same pet are fed in the order they are sent.
 */
class StoreOrderRequest extends FormRequest
{
    /**
     * Every pet in the order must belong to the authenticated user. Malformed
     * pet ids are left to the validation rules.
     */
    public function authorize(): bool
    {
        $items = $this->input('items');
        if (! is_array($items)) {
            return true;
        }

        $petIds = collect($items)
            ->map(fn ($item) => is_array($item) ? ($item['pet_id'] ?? null) : null)
            ->filter(fn ($id) => is_int($id) || ctype_digit((string) $id))
            ->map(fn ($id) => (int) $id)
            ->unique();

        if ($petIds->isEmpty()) {
            return true;
        }

        return $this->user()->pets()->whereIn('id', $petIds)->count() === $petIds->count();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.pet_id' => ['required', 'integer'],
            'items.*.recipe_id' => ['required', 'integer', 'exists:recipes,id'],
            'items.*.duration_days' => ['required', 'integer', 'between:'.OrderItem::MIN_DURATION_DAYS.','.OrderItem::MAX_DURATION_DAYS],
            'delivery_address' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Each item's recipe must be one of that item's pet recipes, and its
     * duration must reach the minimum total ingredient weight of a recipe.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $items = $this->input('items');
                $recipes = Recipe::with('ingredients')->whereIn('id', collect($items)->pluck('recipe_id'))->get()->keyBy('id');

                foreach ($items as $index => $item) {
                    $recipe = $recipes[$item['recipe_id']];

                    if ((int) $recipe->pet_id !== (int) $item['pet_id']) {
                        $validator->errors()->add("items.{$index}.recipe_id", 'The recipe must belong to the selected pet.');

                        continue;
                    }

                    $minimumDays = OrderItem::minimumDurationDaysFor($recipe);
                    if ((int) $item['duration_days'] < $minimumDays) {
                        $validator->errors()->add(
                            "items.{$index}.duration_days",
                            "This recipe needs at least {$minimumDays} days to reach ".Recipe::MIN_TOTAL_WEIGHT_KG.' kg of ingredients.'
                        );
                    }
                }
            },
        ];
    }
}
