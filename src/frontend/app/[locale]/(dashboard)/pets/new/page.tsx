"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { usePets } from "@/hooks/usePets";
import { apiClient } from "@/lib/api-client";
import { petFormSchema, PetFormData } from "@/lib/validations/pet";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";
import { ArrowLeft, PawPrint, Info, Stethoscope, Camera, Loader2, Dog, Cat, PartyPopper } from "lucide-react";

/**
 * Dedicated page for registering a new pet. Health-record features
 * (vaccines, documents) require an existing pet id, so after a successful
 * save the user is redirected straight to the edit page to continue there.
 */
export default function NewPetPage() {
  const t = useTranslations("Pets");
  const tCommon = useTranslations("Common");
  const tCat = useTranslations("Catalog");
  const router = useRouter();
  const { createPet, isCreating } = usePets();

  const [photoUrl, setPhotoUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedPetId, setConfirmedPetId] = useState<number | null>(null);

  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<PetFormData>({
    resolver: zodResolver(petFormSchema),
    defaultValues: { name: "", type: "dog" },
  });

  // useWatch subscribes via context instead of the unstable watch() getter,
  // which the React Compiler cannot memoize safely.
  const watchedValues = useWatch({ control }) as PetFormData;
  const { type, sex, neutered } = watchedValues;

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const { data } = await apiClient.post("/pets/upload-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPhotoUrl(data.data.photo_url);
      setValue("photo_url", data.data.photo_url);
    } catch {
      setSubmitError(tCommon("error"));
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  const onSubmit = async (data: PetFormData) => {
    setSubmitError(null);
    try {
      const result = await createPet(data);
      const newId = result?.data?.id;
      if (newId) {
        setConfirmedPetId(newId);
      } else {
        router.push("/pets");
      }
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, tCommon("error")));
    }
  };

  // Auto-redirect to the edit page (to continue with vaccines/documents)
  // shortly after the success screen is shown.
  useEffect(() => {
    if (confirmedPetId === null) return;
    const timer = setTimeout(() => router.push(`/pets/${confirmedPetId}/edit`), 2500);
    return () => clearTimeout(timer);
  }, [confirmedPetId, router]);

  if (confirmedPetId !== null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 px-4">
        <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center animate-bounce">
          <PartyPopper className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t("pet_created_success")}</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">{t("pet_created_next_step")}</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Link href={`/pets/${confirmedPetId}/edit`}>
            <Button size="lg" className="gap-2">
              <PawPrint className="w-5 h-5" />
              {t("continue_pet_setup")}
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            {t("pet_created_redirect")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/pets")}
          className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <PawPrint className="w-6 h-6 text-primary" />
            {t("new_pet_title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("new_pet_desc")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{t("basic_info")}</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")} *</Label>
                <Input id="name" maxLength={255} {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{tCommon("validation_required")}</p>}
              </div>

              <div className="space-y-2">
                <Label>{t("species")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setValue("type", "dog", { shouldValidate: true })}
                    className={cn(
                      "cursor-pointer border-1 rounded-lg p-2.5 flex items-center justify-center gap-2 transition-all",
                      type === "dog" ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border hover:border-primary/50 text-muted-foreground bg-card hover:bg-muted/50"
                    )}
                  >
                    <Dog className="w-5 h-5" />
                    <span className="text-sm font-semibold">{t("dog")}</span>
                  </div>
                  <div
                    onClick={() => setValue("type", "cat", { shouldValidate: true })}
                    className={cn(
                      "cursor-pointer border-1 rounded-lg p-2.5 flex items-center justify-center gap-2 transition-all",
                      type === "cat" ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border hover:border-primary/50 text-muted-foreground bg-card hover:bg-muted/50"
                    )}
                  >
                    <Cat className="w-5 h-5" />
                    <span className="text-sm font-semibold">{t("cat")}</span>
                  </div>
                </div>
                <input type="hidden" {...register("type")} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="breed">{t("breed")} *</Label>
                  <Input id="breed" maxLength={255} {...register("breed")} />
                  {errors.breed && <p className="text-xs text-destructive">{tCommon("validation_required")}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">{t("age_months")} *</Label>
                  <Input id="age" type="number" min="0" max="360" step="1" {...register("age", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })} />
                  {errors.age && (
                    <p className="text-xs text-destructive">
                      {errors.age.type === "invalid_type" ? tCommon("validation_required") : tCat("validation_non_negative")}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">{t("weight_kg")} *</Label>
                  <Input id="weight" type="number" step="0.1" min="0" max="120" {...register("weight", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })} />
                  {errors.weight && (
                    <p className="text-xs text-destructive">
                      {errors.weight.type === "invalid_type" ? tCommon("validation_required") : tCat("validation_non_negative")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{t("health_info")}</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("sex")} *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setValue("sex", "male", { shouldValidate: true })}
                      className={cn(
                        "text-sm px-3 py-2 rounded-lg border font-medium transition-colors",
                        sex === "male" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      {t("sex_male")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("sex", "female", { shouldValidate: true })}
                      className={cn(
                        "text-sm px-3 py-2 rounded-lg border font-medium transition-colors",
                        sex === "female" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      {t("sex_female")}
                    </button>
                  </div>
                  <input type="hidden" {...register("sex")} />
                  {errors.sex && <p className="text-xs text-destructive">{tCommon("validation_required")}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t("neutered")} *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setValue("neutered", true, { shouldValidate: true })}
                      className={cn(
                        "text-sm px-3 py-2 rounded-lg border font-medium transition-colors",
                        neutered === true ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      {t("neutered_yes")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("neutered", false, { shouldValidate: true })}
                      className={cn(
                        "text-sm px-3 py-2 rounded-lg border font-medium transition-colors",
                        neutered === false ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      {t("neutered_no")}
                    </button>
                  </div>
                  <input type="hidden" {...register("neutered")} />
                  {errors.neutered && <p className="text-xs text-destructive">{tCommon("validation_required")}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="microchip_number">{t("microchip_number")}</Label>
                <Input
                  id="microchip_number"
                  inputMode="numeric"
                  maxLength={15}
                  {...register("microchip_number", {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 15);
                    },
                  })}
                />
                {errors.microchip_number && <p className="text-xs text-destructive">{t("validation_microchip")}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vet_name">{t("vet_name")}</Label>
                  <Input id="vet_name" maxLength={255} {...register("vet_name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vet_phone">{t("vet_phone")}</Label>
                  <PhoneInput
                    id="vet_phone"
                    value={watchedValues.vet_phone || ""}
                    onChange={(v) => setValue("vet_phone", v)}
                  />
                  <input type="hidden" {...register("vet_phone")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restrictions">{t("dietary_restrictions")}</Label>
                <textarea
                  id="restrictions"
                  maxLength={1000}
                  {...register("restrictions")}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                  placeholder={t("restrictions_placeholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">{t("allergies")}</Label>
                <textarea
                  id="allergies"
                  maxLength={1000}
                  {...register("allergies")}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                  placeholder={t("allergies_placeholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="special_needs">{t("special_needs")}</Label>
                <textarea
                  id="special_needs"
                  maxLength={1000}
                  {...register("special_needs")}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                  placeholder={t("special_needs_placeholder")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{t("pet_profile")}</h3>
            </div>
            <div className="p-5 flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border/50 bg-muted/30 flex items-center justify-center relative">
                  {isUploadingPhoto ? (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  ) : photoUrl ? (
                    <Image src={photoUrl} alt="Pet" fill sizes="96px" className="object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground/50" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                    />
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {isUploadingPhoto ? t("photo_uploading") : t("photo_change_hint")}
              </span>
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2.5">
              {t("form_has_errors")}
            </p>
          )}

          {submitError && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2.5">
              {submitError}
            </p>
          )}

          <Button type="submit" className="w-full gap-2" size="lg" disabled={isCreating || isUploadingPhoto}>
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            {isCreating ? t("creating") : t("create_pet_cta")}
          </Button>
        </div>
      </form>
    </div>
  );
}
