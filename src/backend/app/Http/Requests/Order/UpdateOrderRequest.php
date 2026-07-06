<?php

declare(strict_types=1);

namespace App\Http\Requests\Order;

use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for updating an order. Customers may update delivery
 * fields; admins may also update status and the scheduled replenishment date.
 * Authorization is enforced via OrderPolicy.
 */
class UpdateOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var Order $order */
        $order = $this->route('order');

        return $this->user()->can('update', $order);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = [
            'delivery_address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'delivery_date' => ['sometimes', 'nullable', 'date'],
        ];

        if ($this->user()->isAdmin()) {
            $rules['status'] = ['sometimes', 'required', 'in:pending_payment,pending,in_production,ready,out_for_delivery,delivered,cancelled'];
            $rules['scheduled_reposicao_date'] = ['sometimes', 'nullable', 'date'];
        }

        return $rules;
    }
}
