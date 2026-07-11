"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePets } from "@/hooks/usePets";
import { Link } from "@/i18n/routing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Dog, Loader2, LayoutGrid, List as ListIcon, ChevronRight, Search, FilterX } from "lucide-react";

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {tNav("pets")}
          </h1>
          <p className="text-muted-foreground mt-1">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPets.map((pet) => (
              <Card key={pet.id} className="relative overflow-hidden group flex flex-col">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                  <Link href={`/pets/${pet.id}/edit`}>
                    <Button variant="secondary" size="icon" className="w-8 h-8 rounded-full shadow-sm">
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </Link>
                  <Button variant="destructive" size="icon" className="w-8 h-8 rounded-full shadow-sm" onClick={() => handleDelete(pet.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/10 relative">
                  <div className="flex items-center gap-4">
                    {pet.photo_url ? (
                      <Image src={pet.photo_url} alt={pet.name} width={64} height={64} className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Dog className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-xl">{pet.name}</CardTitle>
                      <CardDescription>{pet.breed || t("no_breed")}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground block text-[10px] uppercase tracking-wider mb-0.5">{t("species")}</span>
                      <span className="capitalize">{pet.type === 'cat' ? tCat("cat") : tCat("dog")}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground block text-[10px] uppercase tracking-wider mb-0.5">{t("weight_kg")}</span>
                      <span>{pet.weight ? `${pet.weight} kg` : '-'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground block text-[10px] uppercase tracking-wider mb-0.5">{t("age_months")}</span>
                      <span>{pet.age ? `${pet.age} m` : '-'}</span>
                    </div>
                  </div>

                  {(pet.allergies || pet.restrictions || pet.special_needs) && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                      {pet.allergies && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium border border-red-200 dark:border-red-800">{t("badge_allergies")}</span>}
                      {pet.restrictions && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-medium border border-amber-200 dark:border-amber-800">{t("badge_restrictions")}</span>}
                      {pet.special_needs && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium border border-blue-200 dark:border-blue-800">{t("badge_special_needs")}</span>}
                    </div>
                  )}
                </CardContent>
                <div className="p-4 pt-0 mt-auto">
                  <Link href={`/pets/${pet.id}`}>
                    <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {t("view_full_profile")}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">{t("name").split(" ")[0]}</th>
                  <th className="px-6 py-3 font-medium text-center">{t("species")}</th>
                  <th className="px-6 py-3 font-medium text-center">{t("weight_kg").split(" ")[0]}</th>
                  <th className="px-6 py-3 font-medium text-center">{t("age_months").split(" ")[0]}</th>
                  <th className="px-6 py-3 font-medium">{t("health_alerts")}</th>
                  <th className="px-6 py-3 font-medium text-right">{tCommon("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPets.map((pet) => (
                  <tr key={pet.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {pet.photo_url ? (
                        <Image src={pet.photo_url} alt={pet.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Dog className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground">{pet.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{pet.breed || t("no_breed")}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center capitalize">{pet.type === 'cat' ? tCat("cat") : tCat("dog")}</td>
                    <td className="px-6 py-4 text-center">{pet.weight ? `${pet.weight} kg` : '-'}</td>
                    <td className="px-6 py-4 text-center">{pet.age ? `${pet.age} m` : '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {pet.allergies && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-sm">{t("badge_allergies")}</span>}
                        {pet.restrictions && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-sm">{t("badge_restrictions")}</span>}
                        {pet.special_needs && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-sm">{t("badge_special_needs")}</span>}
                        {!pet.allergies && !pet.restrictions && !pet.special_needs && <span className="text-muted-foreground">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/pets/${pet.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs font-medium">{t("view_profile")}</Button>
                        </Link>
                        <Link href={`/pets/${pet.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
