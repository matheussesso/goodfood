"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePets, Pet } from "@/hooks/usePets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Plus, Edit2, Trash2, Dog, Loader2 } from "lucide-react";

export default function PetsPage() {
  const t = useTranslations("Navigation");
  const { pets, isLoading, createPet, updatePet, deletePet, isCreating, isUpdating, isDeleting } = usePets();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    weight: "",
    age: "",
    restrictions: "",
  });

  const handleOpenModal = (pet?: Pet) => {
    if (pet) {
      setEditingPet(pet);
      setFormData({
        name: pet.name,
        breed: pet.breed || "",
        weight: pet.weight ? pet.weight.toString() : "",
        age: pet.age ? pet.age.toString() : "",
        restrictions: pet.restrictions || "",
      });
    } else {
      setEditingPet(null);
      setFormData({
        name: "",
        breed: "",
        weight: "",
        age: "",
        restrictions: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      breed: formData.breed,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      age: formData.age ? parseInt(formData.age, 10) : undefined,
      restrictions: formData.restrictions,
    };

    if (editingPet) {
      await updatePet({ id: editingPet.id, ...data });
    } else {
      await createPet(data);
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja remover este pet?")) {
      await deletePet(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("pets")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastre e gerencie o perfil dos seus pets.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Pet
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pets?.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <Dog className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-semibold">Nenhum pet encontrado</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Você ainda não tem nenhum pet cadastrado. Adicione seu primeiro pet para montar as dietas ideais.
            </p>
            <Button onClick={() => handleOpenModal()} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Pet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pets?.map((pet) => (
            <Card key={pet.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{pet.name}</CardTitle>
                    <CardDescription>{pet.breed || "Raça não informada"}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(pet)}>
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(pet.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Idade:</span> {pet.age ? `${pet.age} meses` : "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Peso:</span> {pet.weight ? `${pet.weight} kg` : "N/A"}
                  </div>
                  <div className="col-span-2 mt-2">
                    <span className="font-medium">Restrições:</span>
                    <p className="text-muted-foreground">{pet.restrictions || "Nenhuma"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingPet ? "Editar Pet" : "Novo Pet"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" required value={formData.name} onChange={handleChange} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="breed">Raça</Label>
            <Input id="breed" value={formData.breed} onChange={handleChange} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Idade (meses)</Label>
              <Input id="age" type="number" min="0" value={formData.age} onChange={handleChange} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input id="weight" type="number" step="0.1" min="0" value={formData.weight} onChange={handleChange} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="restrictions">Restrições Alimentares</Label>
            <textarea 
              id="restrictions" 
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
              value={formData.restrictions} 
              onChange={handleChange} 
              placeholder="Ex: Alergia a frango"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
