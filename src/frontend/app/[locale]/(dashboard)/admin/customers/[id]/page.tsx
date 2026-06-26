"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import { usePets } from "@/hooks/usePets";
import { ArrowLeft, User, Phone, Mail, Calendar, PawPrint, Package, CalendarDays, Edit2, Loader2, Plus, Dog, UtensilsCrossed, MapPin, LayoutGrid, List as ListIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

import { useParams } from "next/navigation";

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const t = useTranslations("admin");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  
  const { customer, isLoading } = useCustomer(id);
  const { mutateAsync: updateCustomer, isPending: isUpdatingCustomer } = useUpdateCustomer();
  const { createPet, updatePet, deletePet, isCreating: isCreatingPet, isUpdating: isUpdatingPet, isDeleting: isDeletingPet } = usePets();

  const [activeTab, setActiveTab] = useState<"overview" | "pets" | "recipes" | "orders">("overview");
  const [petsViewMode, setPetsViewMode] = useState<"grid" | "list">("grid");
  const [recipesViewMode, setRecipesViewMode] = useState<"grid" | "list">("grid");
  
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "", address: "", city: "", state: "", zipcode: "" });

  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<any>(null);
  const [petForm, setPetForm] = useState({ name: "", type: "dog", breed: "", weight: "", age: "", restrictions: "", allergies: "", special_needs: "" });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-destructive">{t("customer_not_found")}</div>;
  }

  const handleOpenEditCustomer = () => {
    setCustomerForm({ 
      name: customer.name, 
      email: customer.email, 
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      zipcode: customer.zipcode || "",
    });
    setIsEditCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCustomer({ id: customer.id, data: customerForm });
    setIsEditCustomerModalOpen(false);
  };

  const handleOpenPetModal = (pet?: any) => {
    if (pet) {
      setEditingPet(pet);
      setPetForm({
        name: pet.name, type: pet.type || "dog", breed: pet.breed || "",
        weight: pet.weight ? pet.weight.toString() : "", age: pet.age ? pet.age.toString() : "",
        restrictions: pet.restrictions || "", allergies: pet.allergies || "", special_needs: pet.special_needs || ""
      });
    } else {
      setEditingPet(null);
      setPetForm({ name: "", type: "dog", breed: "", weight: "", age: "", restrictions: "", allergies: "", special_needs: "" });
    }
    setIsPetModalOpen(true);
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: petForm.name, type: petForm.type as "dog" | "cat", breed: petForm.breed,
      weight: petForm.weight ? parseFloat(petForm.weight) : undefined,
      age: petForm.age ? parseInt(petForm.age, 10) : undefined,
      restrictions: petForm.restrictions, allergies: petForm.allergies, special_needs: petForm.special_needs,
      user_id: Number(customer.id)
    };

    if (editingPet) {
      await updatePet({ id: editingPet.id, ...data });
    } else {
      await createPet(data);
    }
    
    queryClient.invalidateQueries({ queryKey: ["customer", String(customer.id)] });
    setIsPetModalOpen(false);
  };

  const handleDeletePet = async (id: number) => {
    if (confirm("Deseja realmente excluir este pet?")) {
      await deletePet(id);
      queryClient.invalidateQueries({ queryKey: ["customer", String(customer.id)] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/customers" className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {customer.name}
            <span className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">ID: {customer.id}</span>
          </h1>
          <p className="text-muted-foreground mt-1">{t("customer_details")}</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b">
        {(["overview", "pets", "recipes", "orders"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"}`}
          >
            {tab === "overview" ? "Visão Geral" : tab === "pets" ? "Pets" : tab === "recipes" ? "Receitas" : "Pedidos"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center"><User className="w-5 h-5 mr-2 text-primary" />{t("contact_info")}</CardTitle>
                <Button variant="outline" size="sm" onClick={handleOpenEditCustomer}><Edit2 className="w-4 h-4 mr-2"/> Editar</Button>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-start gap-3"><Mail className="w-5 h-5 text-muted-foreground mt-0.5" /><div><p className="text-sm font-medium">{t("email")}</p><p className="text-sm text-muted-foreground">{customer.email}</p></div></div>
                <div className="flex items-start gap-3"><Phone className="w-5 h-5 text-muted-foreground mt-0.5" /><div><p className="text-sm font-medium">{t("phone")}</p><p className="text-sm text-muted-foreground">{customer.phone || "-"}</p></div></div>
                <div className="flex items-start gap-3"><Calendar className="w-5 h-5 text-muted-foreground mt-0.5" /><div><p className="text-sm font-medium">{t("registered_at")}</p><p className="text-sm text-muted-foreground">{new Date(customer.created_at).toLocaleDateString()}</p></div></div>
                
                <hr className="border-border my-4" />
                <h4 className="text-sm font-semibold flex items-center text-foreground"><MapPin className="w-4 h-4 mr-2 text-primary" /> Endereço</h4>
                
                {customer.address || customer.city || customer.state || customer.zipcode ? (
                  <div className="space-y-2 mt-2">
                    <p className="text-sm text-muted-foreground">{customer.address || "Sem rua informada"}</p>
                    <p className="text-sm text-muted-foreground">{customer.city || "Sem cidade"} - {customer.state || "Estado"}</p>
                    <p className="text-sm text-muted-foreground">CEP: {customer.zipcode || "Não informado"}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic mt-2">Endereço não cadastrado.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "pets" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Pets ({customer.pets?.length || 0})</h2>
              <div className="flex items-center gap-3">
                <div className="flex border rounded-md">
                  <button onClick={() => setPetsViewMode('grid')} className={`p-2 transition-colors ${petsViewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setPetsViewMode('list')} className={`p-2 transition-colors ${petsViewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}><ListIcon className="w-4 h-4" /></button>
                </div>
                <Button onClick={() => handleOpenPetModal()}><Plus className="w-4 h-4 mr-2"/> Adicionar Pet</Button>
              </div>
            </div>
            
            {customer.pets && customer.pets.length > 0 ? (
              petsViewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customer.pets.map(pet => (
                    <Card key={pet.id} className="relative overflow-hidden group">
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button variant="secondary" size="icon" className="w-8 h-8 rounded-full shadow-sm" onClick={() => handleOpenPetModal(pet)}><Edit2 className="w-3 h-3" /></Button>
                      </div>
                      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Dog className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{pet.name}</CardTitle>
                            <CardDescription>{pet.breed || "Sem raça"}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="capitalize font-medium text-foreground">{pet.type === 'cat' ? 'Gato' : 'Cachorro'}</span>
                          <span>•</span>
                          <span>{pet.weight ? `${pet.weight} kg` : 'Peso n/a'}</span>
                          <span>•</span>
                          <span>{pet.age ? `${pet.age} meses` : 'Idade n/a'}</span>
                        </div>
                        
                        {(pet.allergies || pet.restrictions || pet.special_needs) && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {pet.allergies && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium border border-red-200 dark:border-red-800">Alergias</span>}
                            {pet.restrictions && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-medium border border-amber-200 dark:border-amber-800">Restrições</span>}
                            {pet.special_needs && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium border border-blue-200 dark:border-blue-800">Necessidades</span>}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden bg-card">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                      <tr>
                        <th className="px-6 py-3 font-medium">Nome / Raça</th>
                        <th className="px-6 py-3 font-medium text-center">Espécie</th>
                        <th className="px-6 py-3 font-medium text-center">Peso</th>
                        <th className="px-6 py-3 font-medium text-center">Idade</th>
                        <th className="px-6 py-3 font-medium">Alertas de Saúde</th>
                        <th className="px-6 py-3 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {customer.pets.map(pet => (
                        <tr key={pet.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-foreground">{pet.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{pet.breed || "Sem raça"}</div>
                          </td>
                          <td className="px-6 py-4 text-center capitalize">{pet.type === 'cat' ? 'Gato' : 'Cachorro'}</td>
                          <td className="px-6 py-4 text-center">{pet.weight ? `${pet.weight} kg` : '-'}</td>
                          <td className="px-6 py-4 text-center">{pet.age ? `${pet.age} m` : '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {pet.allergies && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-sm">Alergia</span>}
                              {pet.restrictions && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-sm">Restrição</span>}
                              {pet.special_needs && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-sm">Especial</span>}
                              {!pet.allergies && !pet.restrictions && !pet.special_needs && <span className="text-muted-foreground">-</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenPetModal(pet)}><Edit2 className="w-4 h-4 text-muted-foreground" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : <div className="text-center py-12 bg-muted/20 border rounded-lg"><Dog className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" /><p className="text-muted-foreground">Nenhum pet encontrado para este cliente.</p></div>}
          </div>
        )}

        {activeTab === "recipes" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Receitas ({customer.recipes?.length || 0})</h2>
              <div className="flex items-center gap-3">
                <div className="flex border rounded-md">
                  <button onClick={() => setRecipesViewMode('grid')} className={`p-2 transition-colors ${recipesViewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setRecipesViewMode('list')} className={`p-2 transition-colors ${recipesViewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}><ListIcon className="w-4 h-4" /></button>
                </div>
                <Link href={`/recipes/new?user_id=${customer.id}`}>
                  <Button><Plus className="w-4 h-4 mr-2"/> Criar Receita</Button>
                </Link>
              </div>
            </div>
            
            {customer.recipes && customer.recipes.length > 0 ? (
              recipesViewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customer.recipes.map(recipe => (
                    <Card key={recipe.id} className="relative overflow-hidden group border-muted">
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Link href={`/recipes/${recipe.id}`}>
                          <Button variant="secondary" size="icon" className="w-8 h-8 rounded-full shadow-sm"><Edit2 className="w-3 h-3" /></Button>
                        </Link>
                      </div>
                      <CardHeader className="pb-3 border-b border-border/50 bg-primary/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <UtensilsCrossed className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg line-clamp-1" title={recipe.name}>{recipe.name}</CardTitle>
                            <CardDescription className="text-xs">{recipe.is_template ? "Template" : "Personalizada"}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">{recipe.description || "Nenhuma descrição informada."}</p>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm mt-3 pt-3 border-t border-border/50">
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Espécie</span>
                            <span className="font-medium capitalize">{recipe.pet_type === 'cat' ? 'Gato' : recipe.pet_type === 'dog' ? 'Cachorro' : 'Geral'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Duração</span>
                            <span className="font-medium">{recipe.duration_days} dias</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Custo Base</span>
                            <span className="font-semibold text-primary">R$ {Number(recipe.base_cost).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Porções Dia</span>
                            <span className="font-medium">{recipe.daily_portions || '-'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden bg-card">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                      <tr>
                        <th className="px-6 py-3 font-medium">Nome da Receita</th>
                        <th className="px-6 py-3 font-medium text-center">Espécie</th>
                        <th className="px-6 py-3 font-medium text-center">Duração</th>
                        <th className="px-6 py-3 font-medium text-right">Custo Base</th>
                        <th className="px-6 py-3 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {customer.recipes.map(recipe => (
                        <tr key={recipe.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-foreground flex items-center">
                              {recipe.name}
                              {recipe.is_template && <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm">Template</span>}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-[250px]">{recipe.description}</div>
                          </td>
                          <td className="px-6 py-4 text-center capitalize">{recipe.pet_type === 'cat' ? 'Gato' : recipe.pet_type === 'dog' ? 'Cachorro' : 'Geral'}</td>
                          <td className="px-6 py-4 text-center">{recipe.duration_days} dias</td>
                          <td className="px-6 py-4 text-right font-medium text-primary">R$ {Number(recipe.base_cost).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/recipes/${recipe.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs">Ver / Editar</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : <div className="text-center py-12 bg-muted/20 border rounded-lg"><UtensilsCrossed className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" /><p className="text-muted-foreground">Nenhuma receita encontrada para este cliente.</p></div>}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Pedidos ({customer.orders?.length || 0})</h2>
            {customer.orders && customer.orders.length > 0 ? (
              <div className="space-y-3">
                {customer.orders.map(order => (
                  <div key={order.id} className="flex items-center justify-between border rounded-lg p-4 bg-card">
                    <div>
                      <p className="font-medium">#{order.id} - {new Date(order.created_at).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">{order.status}</p>
                    </div>
                    <div className="font-semibold text-primary">R$ {order.total_price}</div>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-12 bg-muted/20 border rounded-lg"><Package className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" /><p className="text-muted-foreground">Nenhum pedido encontrado.</p></div>}
          </div>
        )}
      </div>

      <Modal isOpen={isEditCustomerModalOpen} onClose={() => setIsEditCustomerModalOpen(false)} title="Editar Informações do Cliente">
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center text-sm font-semibold text-primary border-b pb-2"><User className="w-4 h-4 mr-2"/> Dados Básicos</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-name">Nome</Label>
                <Input id="c-name" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-email">E-mail</Label>
                <Input id="c-email" type="email" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-phone">Telefone</Label>
                <Input id="c-phone" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} />
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mt-6">
            <div className="flex items-center text-sm font-semibold text-primary border-b pb-2"><MapPin className="w-4 h-4 mr-2"/> Endereço</div>
            <div className="space-y-2">
              <Label htmlFor="c-address">Rua, Número e Complemento</Label>
              <Input id="c-address" value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} placeholder="Ex: Av Paulista, 1000 - Apto 21" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-city">Cidade</Label>
                <Input id="c-city" value={customerForm.city} onChange={e => setCustomerForm({...customerForm, city: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-state">Estado</Label>
                <Input id="c-state" value={customerForm.state} onChange={e => setCustomerForm({...customerForm, state: e.target.value})} placeholder="SP" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-zipcode">CEP</Label>
                <Input id="c-zipcode" value={customerForm.zipcode} onChange={e => setCustomerForm({...customerForm, zipcode: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditCustomerModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isUpdatingCustomer}>
              {isUpdatingCustomer ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isPetModalOpen} onClose={() => setIsPetModalOpen(false)} title={editingPet ? "Editar Pet" : "Novo Pet"}>
        <form onSubmit={handleSavePet} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nome *</Label><Input required value={petForm.name} onChange={e => setPetForm({...petForm, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Espécie</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={petForm.type} onChange={e => setPetForm({...petForm, type: e.target.value})}><option value="dog">Cachorro</option><option value="cat">Gato</option></select></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Raça</Label><Input value={petForm.breed} onChange={e => setPetForm({...petForm, breed: e.target.value})} /></div>
            <div className="space-y-2"><Label>Idade (meses)</Label><Input type="number" min="0" value={petForm.age} onChange={e => setPetForm({...petForm, age: e.target.value})} /></div>
            <div className="space-y-2"><Label>Peso (kg)</Label><Input type="number" step="0.1" min="0" value={petForm.weight} onChange={e => setPetForm({...petForm, weight: e.target.value})} /></div>
          </div>
          <div className="space-y-2">
            <Label>Restrições Alimentares</Label>
            <textarea className="flex w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={petForm.restrictions} onChange={e => setPetForm({...petForm, restrictions: e.target.value})} placeholder="Sem farinha de trigo, etc..." />
          </div>
          <div className="space-y-2">
            <Label>Alergias</Label>
            <textarea className="flex w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={petForm.allergies} onChange={e => setPetForm({...petForm, allergies: e.target.value})} placeholder="Frango, corantes..." />
          </div>
          <div className="space-y-2">
            <Label>Necessidades Especiais</Label>
            <textarea className="flex w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={petForm.special_needs} onChange={e => setPetForm({...petForm, special_needs: e.target.value})} placeholder="Diabético, cego..." />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsPetModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isCreatingPet || isUpdatingPet}>
              {(isCreatingPet || isUpdatingPet) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar Pet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
