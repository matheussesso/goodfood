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
  const tNav = useTranslations("Navigation");
  const t = useTranslations("Pets");
  const tCommon = useTranslations("Common");
  const { pets, isLoading, createPet, updatePet, deletePet, isCreating, isUpdating, isDeleting } = usePets();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "dog",
    breed: "",
    weight: "",
    age: "",
    restrictions: "",
    allergies: "",
    special_needs: "",
  });

  const handleOpenModal = (pet?: Pet) => {
    if (pet) {
      setEditingPet(pet);
      setFormData({
        name: pet.name,
        type: pet.type || "dog",
        breed: pet.breed || "",
        weight: pet.weight ? pet.weight.toString() : "",
        age: pet.age ? pet.age.toString() : "",
        restrictions: pet.restrictions || "",
        allergies: pet.allergies || "",
        special_needs: pet.special_needs || "",
      });
    } else {
      setEditingPet(null);
      setFormData({
        name: "",
        type: "dog",
        breed: "",
        weight: "",
        age: "",
        restrictions: "",
        allergies: "",
        special_needs: "",
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
      type: formData.type as "dog" | "cat",
      breed: formData.breed,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      age: formData.age ? parseInt(formData.age, 10) : undefined,
      restrictions: formData.restrictions,
      allergies: formData.allergies,
      special_needs: formData.special_needs,
    };

    if (editingPet) {
      await updatePet({ id: editingPet.id, ...data });
    } else {
      await createPet(data);
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm(tCommon("confirm_delete_pet"))) {
      await deletePet(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {tNav("pets")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("pets_desc")}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          {t("new_pet")}
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
            <h3 className="text-lg font-semibold">{t("no_pets")}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t("no_pets_desc")}
            </p>
            <Button onClick={() => handleOpenModal()} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {t("new_pet")}
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
                    <CardDescription>{pet.breed || t("no_breed")}</CardDescription>
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
                    <span className="font-medium">{t("age")}:</span> {pet.age ? `${pet.age} ${t("months")}` : "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">{t("weight")}:</span> {pet.weight ? `${pet.weight} kg` : "N/A"}
                  </div>
                  <div className="col-span-2 mt-2">
                    <span className="font-medium">{t("dietary_restrictions")}:</span>
                    <p className="text-muted-foreground">{pet.restrictions || t("none")}</p>
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
        title={editingPet ? t("edit_pet") : t("new_pet")}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")} *</Label>
              <Input id="name" required value={formData.name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">{t("species")}</Label>
              <select 
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.type} 
                onChange={(e) => setFormData({...formData, type: e.target.value as "dog" | "cat"})}
              >
                <option value="dog">{t("dog")}</option>
                <option value="cat">{t("cat")}</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breed">{t("breed")}</Label>
              <Input id="breed" value={formData.breed} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">{t("age_months")}</Label>
              <Input id="age" type="number" min="0" value={formData.age} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">{t("weight_kg")}</Label>
              <Input id="weight" type="number" step="0.1" min="0" value={formData.weight} onChange={handleChange} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="restrictions">{t("dietary_restrictions")}</Label>
            <textarea 
              id="restrictions" 
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[60px]"
              value={formData.restrictions} 
              onChange={handleChange} 
              placeholder={t("restrictions_placeholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">{t("allergies")}</Label>
            <textarea 
              id="allergies" 
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[60px]"
              value={formData.allergies} 
              onChange={handleChange} 
              placeholder={t("allergies_placeholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_needs">{t("special_needs")}</Label>
            <textarea 
              id="special_needs" 
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[60px]"
              value={formData.special_needs} 
              onChange={handleChange} 
              placeholder={t("special_needs_placeholder")}
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {tCommon("save")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
