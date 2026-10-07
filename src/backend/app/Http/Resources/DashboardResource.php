<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\Pet;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API representation of the customer dashboard summary built by
 * {@see DashboardService}. Wraps the summary array.
 *
 * @property array<string, mixed> $resource
 */
class DashboardResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $summary = $this->resource;
        $alerts = $summary['alerts'];

        return [
            'progress' => $summary['progress'],
            'onboarding_dismissed' => $summary['onboarding_dismissed'],
            'alerts' => [
                'pending_invoices' => $alerts['pending_invoices']->map(fn (Invoice $invoice) => [
                    'id' => $invoice->id,
                    'order_id' => $invoice->order_id,
                    'amount' => $invoice->amount,
                    'due_date' => $invoice->due_date?->toDateString(),
                ])->values(),
                'overdue_vaccines' => $alerts['overdue_vaccines'],
                'incomplete_pets' => $alerts['incomplete_pets'],
            ],
            'current_order' => $summary['current_order'] ? OrderResource::make($summary['current_order']) : null,
            'active_subscription' => $summary['active_subscription'] ? SubscriptionResource::make($summary['active_subscription']) : null,
            'pets' => $summary['pets']->map(fn (Pet $pet) => [
                'id' => $pet->id,
                'name' => $pet->name,
                'type' => $pet->type,
                'breed' => $pet->breed,
                'photo_url' => $pet->photo_url,
                'recipes' => $pet->recipes->map(fn ($recipe) => ['id' => $recipe->id, 'name' => $recipe->name])->values(),
            ])->values(),
            'recent_orders' => $summary['recent_orders']->map(fn (Order $order) => [
                'id' => $order->id,
                'status' => $order->status,
                'total_price' => $order->total_price,
                'items_count' => $order->items_count,
                'invoice_status' => $order->invoice?->status,
                'created_at' => $order->created_at,
            ])->values(),
        ];
    }
}
