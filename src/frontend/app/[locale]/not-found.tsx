import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

/**
 * Localized 404 shown when notFound() is thrown inside the [locale] tree.
 * Rendered as a fragment inside the locale root layout.
 */
export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center p-6">
      <h2 className="text-2xl font-bold text-foreground">{t("title")}</h2>
      <p className="text-muted-foreground">{t("description")}</p>
      <Link href="/" className="text-primary underline underline-offset-4">
        {t("back_home")}
      </Link>
    </div>
  );
}
