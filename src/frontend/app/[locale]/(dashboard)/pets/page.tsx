"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePets } from "@/hooks/usePets";
import { Link } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Dog, Cat, Loader2, LayoutGrid, List as ListIcon, ChevronRight, Search, FilterX } from "lucide-react";

export default function PetsPage() {
  const tNav = useTranslations("Navigation");
  const t = useTranslations("Pets");
  const tCommon = useTranslations("Common");
  const tCat = useTranslations("Catalog");
  const { pets, isLoading, deletePet } = usePets();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "dog" | "cat">("all");

  const handleDelete = async (id: number) => {
    if (confirm(tCommon("confirm_delete_pet"))) {
      await deletePet(id);
    }
  };

  const filteredPets = pets?.filter(pet => {
    const matchesSearch = pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (pet.breed || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || pet.type === filterType;
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {tNav("pets")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("pets_desc")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/pets/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("new_pet")}
            </Button>
          </Link>
        </div>
      </div>

      {pets && pets.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={tCommon("search")}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as "all" | "dog" | "cat")}
            >
              <option value="all">{tCommon("all_species")}</option>
              <option value="dog">{tCat("dog")}</option>
              <option value="cat">{tCat("cat")}</option>
            </select>

            <div className="flex border rounded-md h-10 shrink-0 hidden sm:flex">
              <button onClick={() => setViewMode('grid')} className={`px-3 transition-colors ${viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`px-3 transition-colors ${viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}><ListIcon className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile view toggle */}
      {pets && pets.length > 0 && (
        <div className="flex border rounded-md shrink-0 sm:hidden w-full h-10">
          <button onClick={() => setViewMode('grid')} className={`flex-1 flex justify-center items-center transition-colors ${viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}><LayoutGrid className="w-4 h-4 mr-2" /> {tCommon("grid")}</button>
          <button onClick={() => setViewMode('list')} className={`flex-1 flex justify-center items-center transition-colors ${viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}><ListIcon className="w-4 h-4 mr-2" /> {tCommon("list")}</button>
        </div>
      )}

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
            <Link href="/pets/new" className="mt-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("new_pet")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredPets.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-muted p-4 text-muted-foreground">
              <FilterX className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-semibold">{tCommon("no_results")}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {tCommon("adjust_filters")}
            </p>
            <Button variant="outline" onClick={() => { setSearchQuery(""); setFilterType("all"); }} className="mt-4">
              {tCommon("clear_filters")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPets.map((pet) => {
              const PetIcon = pet.type === "cat" ? Cat : Dog;
              const sexLabel = pet.sex ? (pet.sex === "male" ? t("sex_male") : t("sex_female")) : "—";
              const hasAlerts = !!(pet.allergies || pet.restrictions || pet.special_needs);
              return (
                <Card key={pet.id} className="group hover:shadow-md hover:border-primary/30 transition-all overflow-hidden flex flex-col">
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {pet.photo_url ? (
                          <Image src={pet.photo_url} alt={pet.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <PetIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm leading-tight truncate" title={pet.name}>{pet.name}</h4>
                          <span className="text-[11px] text-muted-foreground truncate block">{pet.breed || t("no_breed")}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Link href={`/pets/${pet.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(pet.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 divide-x divide-border/50 bg-muted/30 rounded-lg">
                      <div className="px-1.5 py-2 text-center min-w-0">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("species")}</span>
                        <span className="font-medium text-xs truncate block">{pet.type === "cat" ? tCat("cat") : tCat("dog")}</span>
                      </div>
                      <div className="px-1.5 py-2 text-center min-w-0">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("sex")}</span>
                        <span className="font-medium text-xs truncate block">{sexLabel}</span>
                      </div>
                      <div className="px-1.5 py-2 text-center min-w-0">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("weight_kg").split(" ")[0]}</span>
                        <span className="font-medium text-xs truncate block">{pet.weight ? `${pet.weight}kg` : "—"}</span>
                      </div>
                      <div className="px-1.5 py-2 text-center min-w-0">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">{t("age_months").split(" ")[0]}</span>
                        <span className="font-medium text-xs truncate block">{pet.age ? `${pet.age}m` : "—"}</span>
                      </div>
                    </div>

                    {hasAlerts && (
                      <div className="flex flex-wrap gap-1 mt-2.5 mb-2.5">
                        {pet.allergies && <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium border border-red-200 dark:border-red-800">{t("badge_allergies")}</span>}
                        {pet.restrictions && <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-medium border border-amber-200 dark:border-amber-800">{t("badge_restrictions")}</span>}
                        {pet.special_needs && <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium border border-blue-200 dark:border-blue-800">{t("badge_special_needs")}</span>}
                      </div>
                    )}

                    <Link
                      href={`/pets/${pet.id}`}
                      className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 pt-2.5 mt-auto border-t border-border/50"
                    >
                      {t("view_profile")}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[760px]">
                <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">{t("name").split(" ")[0]}</th>
                    <th className="px-6 py-3 font-medium text-center">{t("species")}</th>
                    <th className="px-6 py-3 font-medium text-center">{t("sex")}</th>
                    <th className="px-6 py-3 font-medium text-center">{t("weight_kg").split(" ")[0]}</th>
                    <th className="px-6 py-3 font-medium text-center">{t("age_months").split(" ")[0]}</th>
                    <th className="px-6 py-3 font-medium">{t("health_alerts")}</th>
                    <th className="px-6 py-3 font-medium text-right">{tCommon("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredPets.map((pet) => {
                    const sexLabel = pet.sex ? (pet.sex === "male" ? t("sex_male") : t("sex_female")) : "—";
                    return (
                      <tr key={pet.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            {pet.photo_url ? (
                              <Image src={pet.photo_url} alt={pet.name} width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <Dog className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground truncate">{pet.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 truncate">{pet.breed || t("no_breed")}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-center">{pet.type === 'cat' ? tCat("cat") : tCat("dog")}</td>
                        <td className="px-6 py-3.5 text-center">{sexLabel}</td>
                        <td className="px-6 py-3.5 text-center">{pet.weight ? `${pet.weight} kg` : '—'}</td>
                        <td className="px-6 py-3.5 text-center">{pet.age ? `${pet.age} m` : '—'}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {pet.allergies && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-sm">{t("badge_allergies")}</span>}
                            {pet.restrictions && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-sm">{t("badge_restrictions")}</span>}
                            {pet.special_needs && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-sm">{t("badge_special_needs")}</span>}
                            {!pet.allergies && !pet.restrictions && !pet.special_needs && <span className="text-muted-foreground">—</span>}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/pets/${pet.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs font-medium">{t("view_profile")}</Button>
                            </Link>
                            <Link href={`/pets/${pet.id}/edit`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(pet.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
