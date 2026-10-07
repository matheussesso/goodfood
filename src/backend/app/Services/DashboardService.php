<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\Pet;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Builds the customer dashboard summary: onboarding progress, alerts and the
 * orders/subscription currently in flight, using a fixed number of queries.
 */
class DashboardService
{
    /** Onboarding steps, in the order a new customer must go through them. */
    public const STEP_ADD_PET = 'add_pet';

    public const STEP_CREATE_RECIPE = 'create_recipe';

    public const STEP_LINK_RECIPE = 'link_recipe';

    public const STEP_PLACE_ORDER = 'place_order';

    public const STEP_COMPLETE = 'complete';

    /** Pet attributes that should be filled in for a complete profile. */
    private const PET_REQUIRED_FIELDS = ['sex', 'neutered', 'breed', 'weight', 'age'];

    /** How many past orders the dashboard lists. */
    private const RECENT_ORDERS_LIMIT = 5;

    /**
     * Build the dashboard summary for a user.
     *
     * @return array{
     *     progress: array<string, mixed>,
     *     onboarding_dismissed: bool,
     *     alerts: array<string, mixed>,
     *     current_order: Order|null,
     *     active_subscription: Subscription|null,
     *     pets: Collection<int, Pet>,
     *     recent_orders: Collection<int, Order>
     * }
     */
    public function summary(User $user): array
    {
        $pets = $user->pets()
            ->with([
                'recipes' => fn ($query) => $query->where('is_template', false),
                'vaccines',
            ])
            ->get();

        $ownRecipesCount = $user->recipes()->where('is_template', false)->count();
        $ordersCount = $user->orders()->count();
        $subscriptionsCount = $user->subscriptions()->count();
        $linkedRecipesCount = $pets->flatMap(fn (Pet $pet) => $pet->recipes)->pluck('id')->unique()->count();

        return [
            'progress' => [
                'has_address' => $this->hasAddress($user),
                'pets_count' => $pets->count(),
                'own_recipes_count' => $ownRecipesCount,
                'linked_recipes_count' => $linkedRecipesCount,
                // Where the "link a recipe to a pet" step should send the user.
                'first_unlinked_recipe_id' => $user->recipes()->where('is_template', false)->whereDoesntHave('pets')->orderBy('id')->value('id'),
                'orders_count' => $ordersCount,
                'subscriptions_count' => $subscriptionsCount,
                'next_step' => $this->nextStep($pets->count(), $ownRecipesCount, $linkedRecipesCount, $ordersCount + $subscriptionsCount),
            ],
            'onboarding_dismissed' => $user->onboarding_dismissed_at !== null,
            'alerts' => [
                'pending_invoices' => $this->pendingInvoices($user),
                'overdue_vaccines' => $this->overdueVaccines($pets),
                'incomplete_pets' => $this->incompletePets($pets),
            ],
            'current_order' => $this->currentOrder($user),
            'active_subscription' => $this->activeSubscription($user),
            'pets' => $pets,
            'recent_orders' => $user->orders()
                ->with('invoice')
                ->withCount('items')
                ->latest()
                ->latest('id')
                ->limit(self::RECENT_ORDERS_LIMIT)
                ->get(),
        ];
    }

    /**
     * Decide the next onboarding step from simple counts.
     */
    public function nextStep(int $pets, int $ownRecipes, int $linkedRecipes, int $purchases): string
    {
        return match (true) {
            $pets === 0 => self::STEP_ADD_PET,
            $ownRecipes === 0 => self::STEP_CREATE_RECIPE,
            $linkedRecipes === 0 => self::STEP_LINK_RECIPE,
            $purchases === 0 => self::STEP_PLACE_ORDER,
            default => self::STEP_COMPLETE,
        };
    }

    /**
     * Whether the user has the minimum address needed to deliver an order.
     */
    private function hasAddress(User $user): bool
    {
        return filled($user->street) && filled($user->city) && filled($user->zipcode);
    }

    /**
     * Unpaid invoices, soonest due first.
     *
     * @return Collection<int, Invoice>
     */
    private function pendingInvoices(User $user): Collection
    {
        return Invoice::where('user_id', $user->id)
            ->where('status', 'pending')
            ->whereHas('order', fn ($query) => $query->where('status', '!=', 'cancelled'))
            ->orderBy('due_date')
            ->limit(5)
            ->get();
    }

    /**
     * Pets whose latest record of a vaccine is already past its next due date.
     * Only the most recent record per vaccine name counts, so a renewed vaccine
     * is not reported because of its older entry.
     *
     * @param  Collection<int, Pet>  $pets
     * @return array<int, array{pet_id: int, pet_name: string, vaccine_name: string, next_due_date: string}>
     */
    private function overdueVaccines(Collection $pets): array
    {
        $today = Carbon::today();
        $overdue = [];

        foreach ($pets as $pet) {
            // `vaccines` is ordered by application_date desc, so the first of each name is the latest.
            foreach ($pet->vaccines->unique(fn ($vaccine) => mb_strtolower($vaccine->name)) as $vaccine) {
                if ($vaccine->next_due_date !== null && $vaccine->next_due_date->lt($today)) {
                    $overdue[] = [
                        'pet_id' => $pet->id,
                        'pet_name' => $pet->name,
                        'vaccine_name' => $vaccine->name,
                        'next_due_date' => $vaccine->next_due_date->toDateString(),
                    ];
                }
            }
        }

        return $overdue;
    }

    /**
     * Pets that miss required profile fields.
     *
     * @param  Collection<int, Pet>  $pets
     * @return array<int, array{pet_id: int, pet_name: string, missing: array<int, string>}>
     */
    private function incompletePets(Collection $pets): array
    {
        return $pets
            ->map(fn (Pet $pet) => [
                'pet_id' => $pet->id,
                'pet_name' => $pet->name,
                'missing' => array_values(array_filter(
                    self::PET_REQUIRED_FIELDS,
                    fn (string $field) => blank($pet->{$field})
                )),
            ])
            ->filter(fn (array $entry) => $entry['missing'] !== [])
            ->values()
            ->all();
    }

    /**
     * The newest order that is still in flight.
     */
    private function currentOrder(User $user): ?Order
    {
        return $user->orders()
            ->whereNotIn('status', ['delivered', 'cancelled'])
            ->with(['items.recipe', 'items.pet', 'invoice'])
            ->latest()
            ->latest('id')
            ->first();
    }

    /**
     * The active plan that is running now, or else the one starting soonest.
     */
    private function activeSubscription(User $user): ?Subscription
    {
        $plans = $user->subscriptions()
            ->where('status', 'active')
            ->with(['pet', 'recipes.ingredients'])
            ->orderBy('start_date')
            ->get();

        return $plans->first(fn (Subscription $plan) => $plan->current_cycle_index !== null)
            ?? $plans->first(fn (Subscription $plan) => $plan->start_date->gte(Carbon::today()));
    }
}
