"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Pet, usePets } from "@/hooks/usePets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Loader2 } from "lucide-react";

const EMPTY_FORM = { name: "", type: "dog", breed: "", weight: "", age: "", restrictions: "", allergies: "", special_needs: "" };

interface PetFormModalProps {
  /** Customer the pet belongs to (admin creates/edits on their behalf). */
  customerId: number;
  /** Pet being edited, or null to create a new one. */
  pet: Pet | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Admin modal for creating or editing a customer's pet. Owns its own form
 * state (seeded from the pet on mount — the parent must remount it per
 * opening, e.g. by rendering it conditionally) and invalidates the customer
 * query after saving.
 */
export function PetFormModal({ customerId, pet, isOpen, onClose }: PetFormModalProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("Common");
  const tPets = useTranslations("Pets");
  const queryClient = useQueryClient();
  const { createPet, updatePet, isCreating, isUpdating } = usePets();

  const [form, setForm] = useState(() =>
    pet
      ? {
          name: pet.name, type: pet.type || "dog", breed: pet.breed || "",
          weight: pet.weight ? pet.weight.toString() : "", age: pet.age ? pet.age.toString() : "",
          restrictions: pet.restrictions || "", allergies: pet.allergies || "", special_needs: pet.special_needs || "",
        }
      : EMPTY_FORM
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name: form.name, type: form.type as "dog" | "cat", breed: form.breed,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      age: form.age ? parseInt(form.age, 10) : undefined,
      restrictions: form.restrictions, allergies: form.allergies, special_needs: form.special_needs,
      user_id: customerId,
    };

    if (pet) {
      await updatePet({ id: pet.id, ...data });
    } else {
      await createPet(data);
    }

    queryClient.invalidateQueries({ queryKey: ["customer", String(customerId)] });
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={pet ? tPets("edit_pet") : tPets("new_pet")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>{tPets("name")} *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-2"><Label>{tPets("species")}</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="dog">{tPets("dog")}</option><option value="cat">{tPets("cat")}</option></select></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>{tPets("breed")}</Label><Input value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} /></div>
          <div className="space-y-2"><Label>{tPets("age_months")}</Label><Input type="number" min="0" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} /></div>
          <div className="space-y-2"><Label>{tPets("weight_kg")}</Label><Input type="number" step="0.1" min="0" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} /></div>
        </div>
        <div className="space-y-2">
          <Label>{tPets("dietary_restrictions")}</Label>
          <textarea className="flex w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.restrictions} onChange={e => setForm({ ...form, restrictions: e.target.value })} placeholder={tPets("restrictions_placeholder")} />
        </div>
        <div className="space-y-2">
          <Label>{tPets("allergies")}</Label>
          <textarea className="flex w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} placeholder={tPets("allergies_placeholder")} />
        </div>
        <div className="space-y-2">
          <Label>{tPets("special_needs")}</Label>
          <textarea className="flex w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.special_needs} onChange={e => setForm({ ...form, special_needs: e.target.value })} placeholder={tPets("special_needs_placeholder")} />
        </div>
        <div className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>{tCommon("cancel")}</Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t("save_pet")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
