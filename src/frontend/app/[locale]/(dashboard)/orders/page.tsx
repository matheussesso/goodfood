"use client";

import { useOrders, Order } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import {
  ShoppingBag,
  Plus,
  Loader2,
  Package,
  Calendar,
  Dog,
  UtensilsCrossed,
} from "lucide-react";

/** Maps order status to display config. */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:           { label: "Pendente",         className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  in_production:     { label: "Em Produção",       className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  ready:             { label: "Pronto",            className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800" },
  out_for_delivery:  { label: "Saiu p/ Entrega",  className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800" },
  delivered:         { label: "Entregue",          className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
  cancelled:         { label: "Cancelado",         className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
};

/** Compact status badge. */
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

/** Renders a single order card. */
function OrderCard({ order }: { order: Order }) {
  const recipeNames =
    order.items && order.items.length > 0
      ? order.items.map((i) => i.recipe?.name ?? `Receita #${i.recipe_id}`).join(", ")
      : order.recipe?.name ?? "—";

  return (
    <div className="bg-card border rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">Pedido #{order.id}</p>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1 flex items-center gap-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
            {recipeNames}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            {order.pet && (
              <span className="flex items-center gap-1">
                <Dog className="w-3.5 h-3.5" /> {order.pet.name}
              </span>
            )}
            {order.delivery_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Entrega: {new Date(order.delivery_date).toLocaleDateString("pt-BR")}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(order.created_at).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-2xl font-bold text-primary">R$ {Number(order.total_price).toFixed(2)}</p>
        {order.items && order.items.length > 1 && (
          <p className="text-xs text-muted-foreground mt-0.5">{order.items.length} receitas</p>
        )}
      </div>
    </div>
  );
}

/**
 * Customer orders page — lists active and past orders.
 *
 * @returns The orders list page element.
 */
export default function OrdersPage() {
  const { orders, isLoading } = useOrders();

  const activeOrders = orders?.filter((o) => !["delivered", "cancelled"].includes(o.status)) ?? [];
  const pastOrders = orders?.filter((o) => ["delivered", "cancelled"].includes(o.status)) ?? [];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-primary" />
            Meus Pedidos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Acompanhe e gerencie seus pedidos de alimentação natural.
          </p>
        </div>
        <Link href="/orders/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Novo Pedido
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm">Carregando pedidos...</span>
        </div>
      ) : orders?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5 text-center bg-card border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-8 h-8 text-primary/60" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Nenhum pedido ainda</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Crie seu primeiro pedido selecionando receitas dos seus pets.
            </p>
          </div>
          <Link href="/orders/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Criar primeiro pedido
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {activeOrders.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Em andamento ({activeOrders.length})
              </h2>
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </section>
          )}

          {pastOrders.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Histórico ({pastOrders.length})
              </h2>
              {pastOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
