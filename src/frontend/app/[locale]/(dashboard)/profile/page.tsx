"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { BRAZIL_STATES } from "@/lib/brazil-states";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserCircle,
  User,
  Lock,
  Bell,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  CalendarDays,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Section = "personal" | "security" | "preferences";
type FeedbackState = { type: "success" | "error"; message: string } | null;
type FormErrors = Partial<Record<string, string>>;

/** Formats raw digits as XXXXX-XXX. */
function formatCep(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Validates email format. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * User account management page.
 * Personal section shows info card + address card stacked.
 * Security and Preferences are separate tabs.
 *
 * @returns The profile page element.
 */
export default function ProfilePage() {
  const t  = useTranslations("Profile");
  const tC = useTranslations("Common");
  const { user } = useAuth();
  const { updateProfile, isUpdatingProfile, updatePassword, isUpdatingPassword } = useProfile();

  const [activeSection, setActiveSection] = useState<Section>("personal");

  // ── Personal info form ────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name:  user?.name  ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [profileErrors,   setProfileErrors]   = useState<FormErrors>({});
  const [profileFeedback, setProfileFeedback] = useState<FeedbackState>(null);

  // ── Address form ──────────────────────────────────────────────────────────
  const [addrZipcode,      setAddrZipcode]      = useState(user?.zipcode ?? "");
  const [addrStreet,       setAddrStreet]        = useState(user?.address ?? "");
  const [addrNumber,       setAddrNumber]        = useState("");
  const [addrComplement,   setAddrComplement]    = useState("");
  const [addrNeighborhood, setAddrNeighborhood]  = useState("");
  const [addrCity,         setAddrCity]          = useState(user?.city    ?? "");
  const [addrState,        setAddrState]         = useState(user?.state   ?? "");
  const [cepSearching,     setCepSearching]      = useState(false);
  const [cepError,         setCepError]          = useState("");
  const [addrFeedback,     setAddrFeedback]      = useState<FeedbackState>(null);

  // ── Password form ─────────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    current_password:      "",
    password:              "",
    password_confirmation: "",
  });
  const [passwordErrors,   setPasswordErrors]   = useState<FormErrors>({});
  const [passwordFeedback, setPasswordFeedback] = useState<FeedbackState>(null);

  // ── Preferences ───────────────────────────────────────────────────────────
  const [whatsapp,     setWhatsapp]     = useState(user?.whatsapp_notifications ?? false);
  const [prefFeedback, setPrefFeedback] = useState<FeedbackState>(null);
  const [isSavingPref, setIsSavingPref] = useState(false);

  const memberSince = user
    ? new Date(user.created_at ?? Date.now()).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      })
    : "";

  const fetchCep = useCallback(
    async (digits: string) => {
      setCepSearching(true);
      setCepError("");
      try {
        const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (data.erro) {
          setCepError(t("cep_not_found"));
        } else {
          setAddrStreet(data.logradouro   ?? "");
          setAddrNeighborhood(data.bairro ?? "");
          setAddrCity(data.localidade     ?? "");
          setAddrState(data.uf            ?? "");
        }
      } catch {
        setCepError(t("cep_not_found"));
      } finally {
        setCepSearching(false);
      }
    },
    [t]
  );

  useEffect(() => {
    const digits = addrZipcode.replace(/\D/g, "");
    if (digits.length === 8) fetchCep(digits);
    else setCepError("");
  }, [addrZipcode, fetchCep]);

  // ── Validation ────────────────────────────────────────────────────────────

  function validateProfile(): FormErrors {
    const errs: FormErrors = {};
    if (!profileForm.name.trim()) errs.name = tC("validation_required");
    if (!profileForm.email.trim()) errs.email = tC("validation_required");
    else if (!isValidEmail(profileForm.email)) errs.email = tC("validation_email");
    return errs;
  }

  function validatePassword(): FormErrors {
    const errs: FormErrors = {};
    if (!passwordForm.current_password) errs.current_password = tC("validation_required");
    if (!passwordForm.password) errs.password = tC("validation_required");
    else if (passwordForm.password.length < 8) errs.password = tC("validation_password_min");
    if (passwordForm.password !== passwordForm.password_confirmation)
      errs.password_confirmation = tC("validation_password_match");
    return errs;
  }

  function clearProfileError(field: string) {
    if (profileErrors[field]) setProfileErrors((e) => { const { [field]: _, ...rest } = e; return rest; });
  }

  function clearPasswordError(field: string) {
    if (passwordErrors[field]) setPasswordErrors((e) => { const { [field]: _, ...rest } = e; return rest; });
  }

  // ── Submit handlers ───────────────────────────────────────────────────────

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateProfile();
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setProfileErrors({});
    setProfileFeedback(null);
    try {
      await updateProfile(profileForm);
      setProfileFeedback({ type: "success", message: t("profile_updated") });
    } catch (err: any) {
      const msg = err?.response?.data?.message || t("profile_error");
      setProfileFeedback({ type: "error", message: msg });
    } finally {
      setTimeout(() => setProfileFeedback(null), 4000);
    }
  }

  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddrFeedback(null);
    const combinedAddress = [addrStreet, addrNumber, addrComplement]
      .filter(Boolean)
      .join(", ");
    try {
      await updateProfile({
        name:    profileForm.name,
        email:   profileForm.email,
        address: combinedAddress,
        city:    addrCity,
        state:   addrState,
        zipcode: addrZipcode.replace(/\D/g, ""),
      });
      setAddrFeedback({ type: "success", message: t("address_updated") });
    } catch (err: any) {
      const msg = err?.response?.data?.message || t("profile_error");
      setAddrFeedback({ type: "error", message: msg });
    } finally {
      setTimeout(() => setAddrFeedback(null), 4000);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validatePassword();
    if (Object.keys(errs).length) { setPasswordErrors(errs); return; }
    setPasswordErrors({});
    setPasswordFeedback(null);
    try {
      await updatePassword(passwordForm);
      setPasswordFeedback({ type: "success", message: t("password_updated") });
      setPasswordForm({ current_password: "", password: "", password_confirmation: "" });
    } catch (err: any) {
      const msg = err?.response?.data?.message || t("password_error");
      setPasswordFeedback({ type: "error", message: msg });
    } finally {
      setTimeout(() => setPasswordFeedback(null), 4000);
    }
  }

  async function handlePrefSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPrefFeedback(null);
    setIsSavingPref(true);
    try {
      await updateProfile({ ...profileForm, whatsapp_notifications: whatsapp });
      setPrefFeedback({ type: "success", message: t("preferences_updated") });
    } catch (err: any) {
      const msg = err?.response?.data?.message || t("profile_error");
      setPrefFeedback({ type: "error", message: msg });
    } finally {
      setIsSavingPref(false);
      setTimeout(() => setPrefFeedback(null), 4000);
    }
  }

  const SECTIONS: { key: Section; label: string; icon: typeof User }[] = [
    { key: "personal",    label: t("personal_info"), icon: User },
    { key: "security",    label: t("security"),       icon: Lock },
    { key: "preferences", label: t("preferences"),    icon: Bell },
  ];

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")
    : "";

  const inputError = (field: string, errors: FormErrors) =>
    errors[field] ? "border-destructive focus-visible:ring-destructive" : "";

  return (
    <div className="space-y-6 mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <UserCircle className="w-7 h-7 text-primary" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* Left panel */}
        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-6 flex flex-col items-center gap-3 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
              {initials || <UserCircle className="w-10 h-10" />}
            </div>
            <div>
              <p className="font-semibold text-foreground">{user?.name}</p>
              <p>{user?.email}</p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
              <Shield className="w-3 h-3" />
              <span className="capitalize font-medium">{user?.role}</span>
            </div>
            {memberSince && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CalendarDays className="w-3 h-3" />
                {t("member_since")} {memberSince}
              </div>
            )}
          </div>

          <nav className="bg-card border rounded-xl overflow-hidden shadow-sm">
            {SECTIONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors text-left",
                  activeSection === key
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right panel */}
        <div className="space-y-4">

          {/* ─ Personal info ─────────────────────────────────────────────── */}
          {activeSection === "personal" && (
            <>
              <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    {t("personal_info")}
                  </h2>
                </div>

                <form onSubmit={handleProfileSubmit} className="p-6 space-y-4" noValidate>
                  {profileFeedback && <FeedbackBanner feedback={profileFeedback} />}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label htmlFor="name">{t("name")}</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) => {
                          setProfileForm((f) => ({ ...f, name: e.target.value }));
                          clearProfileError("name");
                        }}
                        className={inputError("name", profileErrors)}
                      />
                      {profileErrors.name && <FieldError msg={profileErrors.name} />}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email">{t("email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => {
                          setProfileForm((f) => ({ ...f, email: e.target.value }));
                          clearProfileError("email");
                        }}
                        className={inputError("email", profileErrors)}
                      />
                      {profileErrors.email && <FieldError msg={profileErrors.email} />}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone">{t("phone")}</Label>
                      <PhoneInput
                        id="phone"
                        value={profileForm.phone}
                        onChange={(v) => setProfileForm((f) => ({ ...f, phone: v }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isUpdatingProfile} className="gap-2">
                      {isUpdatingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                      {t("save_profile")}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Address card */}
              <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    {t("address_section")}
                  </h2>
                </div>

                <form onSubmit={handleAddressSubmit} className="p-6 space-y-4">
                  {addrFeedback && <FeedbackBanner feedback={addrFeedback} />}

                  {/* CEP */}
                  <div className="space-y-1.5">
                    <Label htmlFor="addr_zipcode">{t("zipcode")}</Label>
                    <div className="relative">
                      <Input
                        id="addr_zipcode"
                        placeholder="00000-000"
                        inputMode="numeric"
                        value={addrZipcode}
                        onChange={(e) => setAddrZipcode(formatCep(e.target.value))}
                        className={cn("pr-9", cepError && "border-destructive focus-visible:ring-destructive")}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                        {cepSearching
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Search className="w-4 h-4 opacity-40" />}
                      </div>
                    </div>
                    {cepSearching && <p className="text-xs text-muted-foreground">{t("cep_searching")}</p>}
                    {cepError    && <FieldError msg={cepError} />}
                  </div>

                  {/* Street + Number */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label htmlFor="addr_street">{t("addr_street")}</Label>
                      <Input
                        id="addr_street"
                        placeholder="Av. Paulista"
                        value={addrStreet}
                        onChange={(e) => setAddrStreet(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="addr_number">{t("addr_number")}</Label>
                      <Input
                        id="addr_number"
                        placeholder="123"
                        value={addrNumber}
                        onChange={(e) => setAddrNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Complement */}
                  <div className="space-y-1.5">
                    <Label htmlFor="addr_complement">{t("addr_complement")}</Label>
                    <Input
                      id="addr_complement"
                      placeholder="Apto, bloco, referência..."
                      value={addrComplement}
                      onChange={(e) => setAddrComplement(e.target.value)}
                    />
                  </div>

                  {/* Neighborhood */}
                  <div className="space-y-1.5">
                    <Label htmlFor="addr_neighborhood">{t("addr_neighborhood")}</Label>
                    <Input
                      id="addr_neighborhood"
                      placeholder="Bela Vista"
                      value={addrNeighborhood}
                      onChange={(e) => setAddrNeighborhood(e.target.value)}
                    />
                  </div>

                  {/* City + State */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="addr_city">{t("addr_city")}</Label>
                      <Input
                        id="addr_city"
                        placeholder="São Paulo"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="addr_state">{t("addr_state")}</Label>
                      <select
                        id="addr_state"
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">{t("select_state")}</option>
                        {BRAZIL_STATES.map((s) => (
                          <option key={s.uf} value={s.uf}>{s.uf} — {s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isUpdatingProfile} className="gap-2">
                      {isUpdatingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                      {t("save_address")}
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* ─ Security ──────────────────────────────────────────────────── */}
          {activeSection === "security" && (
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  {t("security")}
                </h2>
              </div>

              <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4" noValidate>
                {passwordFeedback && <FeedbackBanner feedback={passwordFeedback} />}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="current_password">{t("current_password")}</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => {
                        setPasswordForm((f) => ({ ...f, current_password: e.target.value }));
                        clearPasswordError("current_password");
                      }}
                      autoComplete="current-password"
                      className={inputError("current_password", passwordErrors)}
                    />
                    {passwordErrors.current_password && <FieldError msg={passwordErrors.current_password} />}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="new_password">{t("new_password")}</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordForm.password}
                      onChange={(e) => {
                        setPasswordForm((f) => ({ ...f, password: e.target.value }));
                        clearPasswordError("password");
                      }}
                      autoComplete="new-password"
                      className={inputError("password", passwordErrors)}
                    />
                    {passwordErrors.password && <FieldError msg={passwordErrors.password} />}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm_password">{t("confirm_password")}</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordForm.password_confirmation}
                      onChange={(e) => {
                        setPasswordForm((f) => ({ ...f, password_confirmation: e.target.value }));
                        clearPasswordError("password_confirmation");
                      }}
                      autoComplete="new-password"
                      className={inputError("password_confirmation", passwordErrors)}
                    />
                    {passwordErrors.password_confirmation && <FieldError msg={passwordErrors.password_confirmation} />}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isUpdatingPassword} className="gap-2">
                    {isUpdatingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t("change_password")}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ─ Preferences ───────────────────────────────────────────────── */}
          {activeSection === "preferences" && (
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  {t("preferences")}
                </h2>
              </div>

              <form onSubmit={handlePrefSubmit} className="p-6 space-y-6">
                {prefFeedback && <FeedbackBanner feedback={prefFeedback} />}

                <div className="flex items-start gap-4 p-4 border rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 text-green-600">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{t("whatsapp_notifications")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("whatsapp_desc")}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={whatsapp}
                    onClick={() => setWhatsapp((v) => !v)}
                    className={cn(
                      "relative w-10 h-6 rounded-full transition-colors shrink-0 mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                      whatsapp ? "bg-primary" : "bg-border"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-150",
                        whatsapp ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSavingPref} className="gap-2">
                    {isSavingPref && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t("save_preferences")}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Inline field error message. */
function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs text-destructive mt-0.5">{msg}</p>;
}

/**
 * Success or error feedback banner.
 *
 * @param feedback - The feedback state to render.
 */
function FeedbackBanner({ feedback }: { feedback: NonNullable<FeedbackState> }) {
  const Icon = feedback.type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border",
        feedback.type === "success"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
          : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {feedback.message}
    </div>
  );
}
