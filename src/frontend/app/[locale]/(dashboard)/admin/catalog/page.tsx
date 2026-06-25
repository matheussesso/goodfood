"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useIngredients, Ingredient } from "@/hooks/useIngredients";
import { useRecipes, Recipe } from "@/hooks/useRecipes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Plus, Edit2, Trash2, Loader2, BookOpen, Apple } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CatalogPage() {
  const t = useTranslations("Navigation");
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"ingredients" | "recipes">("ingredients");

  // Ingredients Hooks & State
  const { 
    ingredients, isLoading: isLoadingIng, 
    createIngredient, updateIngredient, deleteIngredient, 
    isCreating: isCreatingIng, isUpdating: isUpdatingIng 
  } = useIngredients();
  
  const [isIngModalOpen, setIsIngModalOpen] = useState(false);
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null);
  const [ingForm, setIngForm] = useState({
    name: "", description: "", unit: "kg", unit_cost: "", stock_quantity: "", is_active: true
  });

  // Recipes Hooks & State
  const { 
    recipes, isLoading: isLoadingRec, 
    createRecipe, updateRecipe, deleteRecipe, 
    isCreating: isCreatingRec, isUpdating: isUpdatingRec 
  } = useRecipes();

  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<Recipe | null>(null);
  const [recForm, setRecForm] = useState({
    name: "", description: "", price: "", weight_per_portion: "", is_active: true
  });
  const [recipeIngredients, setRecipeIngredients] = useState<{id: number, quantity: string}[]>([]);

  if (user?.role !== "admin") {
    return <div className="p-8 text-center text-destructive">Acesso negado. Apenas administradores.</div>;
  }

  // --- Ingredients Handlers ---
  const handleOpenIngModal = (ing?: Ingredient) => {
    if (ing) {
      setEditingIng(ing);
      setIngForm({
        name: ing.name, description: ing.description || "", unit: ing.unit,
        unit_cost: ing.unit_cost.toString(), stock_quantity: ing.stock_quantity.toString(), is_active: ing.is_active
      });
    } else {
      setEditingIng(null);
      setIngForm({ name: "", description: "", unit: "kg", unit_cost: "", stock_quantity: "", is_active: true });
    }
    setIsIngModalOpen(true);
  };

  const handleIngSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: ingForm.name, description: ingForm.description, unit: ingForm.unit,
      unit_cost: parseFloat(ingForm.unit_cost), stock_quantity: parseInt(ingForm.stock_quantity || "0", 10), is_active: ingForm.is_active
    };

    if (editingIng) await updateIngredient({ id: editingIng.id, ...data });
    else await createIngredient(data);
    
    setIsIngModalOpen(false);
  };

  const handleDeleteIng = async (id: number) => {
    if (confirm("Tem certeza que deseja remover este ingrediente?")) await deleteIngredient(id);
  };

  // --- Recipes Handlers ---
  const handleOpenRecModal = (rec?: Recipe) => {
    if (rec) {
      setEditingRec(rec);
      setRecForm({
        name: rec.name, description: rec.description || "",
        price: rec.price.toString(), weight_per_portion: rec.weight_per_portion.toString(), is_active: rec.is_active
      });
      setRecipeIngredients(rec.ingredients.map(i => ({ id: i.id, quantity: i.pivot.quantity })));
    } else {
      setEditingRec(null);
      setRecForm({ name: "", description: "", price: "", weight_per_portion: "", is_active: true });
      setRecipeIngredients([]);
    }
    setIsRecModalOpen(true);
  };

  const handleRecSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: recForm.name, description: recForm.description,
      price: parseFloat(recForm.price), weight_per_portion: parseFloat(recForm.weight_per_portion), is_active: recForm.is_active,
      ingredients: recipeIngredients.map(i => ({ id: i.id, quantity: parseFloat(i.quantity) }))
    };

    if (editingRec) await updateRecipe({ id: editingRec.id, ...data });
    else await createRecipe(data);
    
    setIsRecModalOpen(false);
  };

  const handleDeleteRec = async (id: number) => {
    if (confirm("Tem certeza que deseja remover esta receita?")) await deleteRecipe(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("catalog")}</h1>
          <p className="text-muted-foreground mt-1">Gerencie ingredientes e crie formulações de receitas.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab("ingredients")}
            className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", activeTab === "ingredients" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <Apple className="inline-block w-4 h-4 mr-2" /> Ingredientes
          </button>
          <button 
            onClick={() => setActiveTab("recipes")}
            className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", activeTab === "recipes" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <BookOpen className="inline-block w-4 h-4 mr-2" /> Receitas
          </button>
        </div>
      </div>

      {activeTab === "ingredients" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Ingredientes</CardTitle>
              <CardDescription>Estoque e custos de ingredientes base.</CardDescription>
            </div>
            <Button onClick={() => handleOpenIngModal()}><Plus className="h-4 w-4 mr-2" /> Novo Ingrediente</Button>
          </CardHeader>
          <CardContent>
            {isLoadingIng ? <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div> : (
              <div className="divide-y border rounded-md">
                {ingredients?.map(ing => (
                  <div key={ing.id} className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{ing.name}</h4>
                      <p className="text-sm text-muted-foreground">Custo: R$ {ing.unit_cost} / {ing.unit} | Estoque: {ing.stock_quantity}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenIngModal(ing)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteIng(ing.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
                {ingredients?.length === 0 && <div className="p-8 text-center text-muted-foreground">Nenhum ingrediente.</div>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "recipes" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Receitas</CardTitle>
              <CardDescription>Formulações compostas por ingredientes.</CardDescription>
            </div>
            <Button onClick={() => handleOpenRecModal()}><Plus className="h-4 w-4 mr-2" /> Nova Receita</Button>
          </CardHeader>
          <CardContent>
            {isLoadingRec ? <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div> : (
              <div className="grid gap-4 md:grid-cols-2">
                {recipes?.map(rec => (
                  <Card key={rec.id} className="bg-muted/30">
                    <CardHeader className="p-4 flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{rec.name}</CardTitle>
                        <CardDescription>{rec.weight_per_portion}kg por porção | Venda: R$ {rec.price}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenRecModal(rec)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteRec(rec.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm font-medium mb-2">Composição:</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {rec.ingredients?.map(i => (
                          <li key={i.id}>{i.name}: {i.pivot.quantity} {i.unit}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
                {recipes?.length === 0 && <div className="col-span-2 p-8 text-center text-muted-foreground border rounded-md">Nenhuma receita cadastrada.</div>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Modal isOpen={isIngModalOpen} onClose={() => setIsIngModalOpen(false)} title={editingIng ? "Editar Ingrediente" : "Novo Ingrediente"}>
        <form onSubmit={handleIngSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Nome</Label><Input required value={ingForm.name} onChange={e => setIngForm({...ingForm, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unidade de Medida</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={ingForm.unit} onChange={e => setIngForm({...ingForm, unit: e.target.value})}>
                <option value="kg">Quilograma (kg)</option>
                <option value="g">Grama (g)</option>
                <option value="l">Litro (L)</option>
                <option value="unit">Unidade</option>
              </select>
            </div>
            <div className="space-y-2"><Label>Custo por Unidade (R$)</Label><Input type="number" step="0.01" required value={ingForm.unit_cost} onChange={e => setIngForm({...ingForm, unit_cost: e.target.value})} /></div>
          </div>
          <div className="space-y-2"><Label>Estoque Inicial</Label><Input type="number" value={ingForm.stock_quantity} onChange={e => setIngForm({...ingForm, stock_quantity: e.target.value})} /></div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsIngModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isCreatingIng || isUpdatingIng}>Salvar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isRecModalOpen} onClose={() => setIsRecModalOpen(false)} title={editingRec ? "Editar Receita" : "Nova Receita"}>
        <form onSubmit={handleRecSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Nome da Receita</Label><Input required value={recForm.name} onChange={e => setRecForm({...recForm, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Preço de Venda (R$)</Label><Input type="number" step="0.01" required value={recForm.price} onChange={e => setRecForm({...recForm, price: e.target.value})} /></div>
            <div className="space-y-2"><Label>Peso da Porção (kg)</Label><Input type="number" step="0.01" required value={recForm.weight_per_portion} onChange={e => setRecForm({...recForm, weight_per_portion: e.target.value})} /></div>
          </div>
          <div className="space-y-2">
            <Label>Ingredientes da Formulação</Label>
            <div className="border rounded-md p-3 space-y-3 bg-muted/30">
              {recipeIngredients.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm flex-1"
                    value={item.id} onChange={e => {
                      const newArr = [...recipeIngredients]; newArr[idx].id = parseInt(e.target.value); setRecipeIngredients(newArr);
                    }}
                  >
                    <option value={0} disabled>Selecione...</option>
                    {ingredients?.map(ing => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}
                  </select>
                  <Input type="number" step="0.01" placeholder="Qtd" className="w-24 h-9" value={item.quantity} onChange={e => {
                    const newArr = [...recipeIngredients]; newArr[idx].quantity = e.target.value; setRecipeIngredients(newArr);
                  }} />
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setRecipeIngredients([...recipeIngredients, {id: 0, quantity: ""}])}>
                <Plus className="h-3 w-3 mr-1" /> Adicionar Ingrediente
              </Button>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsRecModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isCreatingRec || isUpdatingRec}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
