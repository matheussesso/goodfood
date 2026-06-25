"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { usePets } from "@/hooks/usePets";
import { useRecipes } from "@/hooks/useRecipes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Plus, Edit2, Package, RefreshCw, Loader2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrdersPage() {
  const t = useTranslations("Navigation");
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"subscriptions" | "orders">("subscriptions");

  // Data
  const { pets } = usePets();
  const { recipes } = useRecipes();
  const { subscriptions, isLoading: isLoadingSub, createSubscription, updateSubscription, isCreating: isCreatingSub } = useSubscriptions();
  const { orders, isLoading: isLoadingOrd, createOrder, isCreating: isCreatingOrd } = useOrders();

  // Modals
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Forms
  const [subForm, setSubForm] = useState({ pet_id: "", recipe_id: "", frequency: "weekly", start_date: "" });
  const [orderForm, setOrderForm] = useState({ pet_id: "", recipe_id: "", total_price: "", delivery_date: "" });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Ativa</span>;
      case 'paused': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pausada</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Cancelada</span>;
      case 'pending': return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">Pendente</span>;
      case 'in_production': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Em Produção</span>;
      case 'delivered': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Entregue</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSubscription({
      pet_id: parseInt(subForm.pet_id),
      recipe_id: parseInt(subForm.recipe_id),
      frequency: subForm.frequency,
      start_date: subForm.start_date,
    });
    setIsSubModalOpen(false);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOrder({
      pet_id: orderForm.pet_id ? parseInt(orderForm.pet_id) : undefined,
      recipe_id: parseInt(orderForm.recipe_id),
      total_price: parseFloat(orderForm.total_price),
      delivery_date: orderForm.delivery_date,
    });
    setIsOrderModalOpen(false);
  };

  const updateSubStatus = async (id: number, status: string) => {
    await updateSubscription({ id, status });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pedidos e Assinaturas</h1>
          <p className="text-muted-foreground mt-1">Gerencie a alimentação contínua e pedidos avulsos.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab("subscriptions")}
            className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", activeTab === "subscriptions" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <RefreshCw className="inline-block w-4 h-4 mr-2" /> Assinaturas
          </button>
          <button 
            onClick={() => setActiveTab("orders")}
            className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", activeTab === "orders" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <Package className="inline-block w-4 h-4 mr-2" /> Pedidos
          </button>
        </div>
      </div>

      {activeTab === "subscriptions" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Minhas Assinaturas</CardTitle>
              <CardDescription>Planos alimentares recorrentes para seus pets.</CardDescription>
            </div>
            {user?.role !== "producer" && user?.role !== "delivery" && (
              <Button onClick={() => setIsSubModalOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nova Assinatura</Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingSub ? <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div> : (
              <div className="grid gap-4 md:grid-cols-2">
                {subscriptions?.map(sub => (
                  <Card key={sub.id} className="bg-muted/20">
                    <CardHeader className="p-4 pb-2 border-b flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Plano: {sub.pet?.name} {getStatusBadge(sub.status)}
                        </CardTitle>
                        <CardDescription>{sub.recipe?.name} ({sub.frequency})</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col gap-2">
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Próxima Entrega:</span> {sub.next_delivery_date || "N/A"}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Início:</span> {sub.start_date}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex gap-2">
                      {sub.status === 'active' ? (
                        <Button variant="outline" size="sm" onClick={() => updateSubStatus(sub.id, 'paused')}>Pausar</Button>
                      ) : sub.status === 'paused' ? (
                        <Button variant="outline" size="sm" onClick={() => updateSubStatus(sub.id, 'active')}>Reativar</Button>
                      ) : null}
                      {sub.status !== 'cancelled' && (
                        <Button variant="ghost" className="text-destructive hover:bg-destructive/10" size="sm" onClick={() => updateSubStatus(sub.id, 'cancelled')}>Cancelar</Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
                {subscriptions?.length === 0 && <div className="col-span-2 p-8 text-center text-muted-foreground border rounded-md">Você não tem assinaturas ativas.</div>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "orders" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Histórico de Pedidos</CardTitle>
              <CardDescription>Acompanhe pedidos avulsos ou processados via assinatura.</CardDescription>
            </div>
            {user?.role !== "producer" && user?.role !== "delivery" && (
              <Button onClick={() => setIsOrderModalOpen(true)}><Plus className="h-4 w-4 mr-2" /> Novo Pedido</Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingOrd ? <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div> : (
              <div className="divide-y border rounded-md">
                {orders?.map(order => (
                  <div key={order.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">Pedido #{order.id}</h4>
                        {getStatusBadge(order.status)}
                        {order.subscription_id && <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md text-[10px] font-bold tracking-wider uppercase">Assinatura</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.recipe?.name} {order.pet && `para ${order.pet.name}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Data de Entrega: {order.delivery_date || "Agendando..."}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">R$ {order.total_price}</p>
                      {order.status === 'pending' && <Button variant="link" size="sm" className="h-auto p-0">Pagar Agora</Button>}
                    </div>
                  </div>
                ))}
                {orders?.length === 0 && <div className="p-8 text-center text-muted-foreground">Nenhum pedido encontrado.</div>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscription Modal */}
      <Modal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} title="Nova Assinatura">
        <form onSubmit={handleSubSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Para qual pet?</Label>
            <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={subForm.pet_id} onChange={e => setSubForm({...subForm, pet_id: e.target.value})}>
              <option value="" disabled>Selecione um pet...</option>
              {pets?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Receita</Label>
            <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={subForm.recipe_id} onChange={e => setSubForm({...subForm, recipe_id: e.target.value})}>
              <option value="" disabled>Selecione uma receita...</option>
              {recipes?.filter(r => r.is_active).map(r => <option key={r.id} value={r.id}>{r.name} (R$ {r.price})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequência</Label>
              <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={subForm.frequency} onChange={e => setSubForm({...subForm, frequency: e.target.value})}>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quinzenal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input type="date" required value={subForm.start_date} onChange={e => setSubForm({...subForm, start_date: e.target.value})} />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsSubModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isCreatingSub}>Assinar Agora <CreditCard className="ml-2 w-4 h-4" /></Button>
          </div>
        </form>
      </Modal>

      {/* Order Modal */}
      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Novo Pedido Avulso">
        <form onSubmit={handleOrderSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Pet (Opcional)</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={orderForm.pet_id} onChange={e => setOrderForm({...orderForm, pet_id: e.target.value})}>
              <option value="">Sem vínculo</option>
              {pets?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Receita</Label>
            <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={orderForm.recipe_id} onChange={e => {
              const recipe = recipes?.find(r => r.id === parseInt(e.target.value));
              setOrderForm({...orderForm, recipe_id: e.target.value, total_price: recipe ? recipe.price.toString() : ""});
            }}>
              <option value="" disabled>Selecione uma receita...</option>
              {recipes?.filter(r => r.is_active).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preço Total (R$)</Label>
              <Input type="number" step="0.01" required value={orderForm.total_price} onChange={e => setOrderForm({...orderForm, total_price: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Data de Entrega</Label>
              <Input type="date" value={orderForm.delivery_date} onChange={e => setOrderForm({...orderForm, delivery_date: e.target.value})} />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOrderModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isCreatingOrd}>Comprar</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
