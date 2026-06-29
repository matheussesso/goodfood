"use client";

import { cn } from "@/lib/utils";

/** Country code definition with phone number formatting. */
interface CountryDef {
  code: string;
  flag: string;
  label: string;
  maxDigits: number;
  format: (digits: string) => string;
}

// ── Reusable format helpers ───────────────────────────────────────────────────

/** (XX) XXXXX-XXXX — 11 digits (BR mobile). */
const fmt11 = (d: string) => {
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
};

/** (XXX) XXX-XXXX — 10 digits, 3-digit area code (US/MX/CA). */
const fmt10_3 = (d: string) => {
  if (!d) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
};

/** (XX) XXXX-XXXX — 10 digits, 2-digit area code (AR, CO, VE, CL). */
const fmt10_2 = (d: string) => {
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6, 10)}`;
};

/** XXX XXX XXX — 9 digits (PT, ES, PE, EC, PY, NL). */
const fmt9 = (d: string) => {
  if (!d) return "";
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`;
};

/** XXXX-XXXX — 8 digits (BO, UY, CU, PA, GT, SV, HN, NI, CR). */
const fmt8 = (d: string) => {
  if (!d) return "";
  if (d.length <= 4) return d;
  return `${d.slice(0, 4)}-${d.slice(4, 8)}`;
};

/** XX XXXX XXXX — 10 digits (AU, FR, BE). */
const fmt10_au = (d: string) => {
  if (!d) return "";
  if (d.length <= 2) return d;
  if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6, 10)}`;
};

/** XX XXXX-XXXX — 11 digits (DE, JP, CN). */
const fmt11_de = (d: string) => {
  if (!d) return "";
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 7)}-${d.slice(7, 11)}`;
};

/** XXXXX XXXXXX — 11 digits (UK). */
const fmt11_uk = (d: string) => {
  if (!d) return "";
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)} ${d.slice(5, 11)}`;
};

/** XXX XXX XXXX — 10 digits (IN, IT). */
const fmt10_in = (d: string) => {
  if (!d) return "";
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
};

// ── Country list (sorted: Brasil first, then LatAm, then RoW) ───────────────

/** All supported countries with their dial codes and masks. */
const COUNTRIES: CountryDef[] = [
  // ─ Brasil ─
  { code: "+55",  flag: "🇧🇷", label: "Brasil",              maxDigits: 11, format: fmt11      },
  // ─ América Latina ─
  { code: "+54",  flag: "🇦🇷", label: "Argentina",           maxDigits: 10, format: fmt10_2   },
  { code: "+591", flag: "🇧🇴", label: "Bolívia",             maxDigits: 8,  format: fmt8       },
  { code: "+56",  flag: "🇨🇱", label: "Chile",               maxDigits: 9,  format: fmt9       },
  { code: "+57",  flag: "🇨🇴", label: "Colômbia",            maxDigits: 10, format: fmt10_2   },
  { code: "+506", flag: "🇨🇷", label: "Costa Rica",          maxDigits: 8,  format: fmt8       },
  { code: "+53",  flag: "🇨🇺", label: "Cuba",                maxDigits: 8,  format: fmt8       },
  { code: "+593", flag: "🇪🇨", label: "Equador",             maxDigits: 9,  format: fmt9       },
  { code: "+503", flag: "🇸🇻", label: "El Salvador",         maxDigits: 8,  format: fmt8       },
  { code: "+502", flag: "🇬🇹", label: "Guatemala",           maxDigits: 8,  format: fmt8       },
  { code: "+504", flag: "🇭🇳", label: "Honduras",            maxDigits: 8,  format: fmt8       },
  { code: "+52",  flag: "🇲🇽", label: "México",              maxDigits: 10, format: fmt10_3   },
  { code: "+505", flag: "🇳🇮", label: "Nicarágua",           maxDigits: 8,  format: fmt8       },
  { code: "+507", flag: "🇵🇦", label: "Panamá",              maxDigits: 8,  format: fmt8       },
  { code: "+595", flag: "🇵🇾", label: "Paraguai",            maxDigits: 9,  format: fmt9       },
  { code: "+51",  flag: "🇵🇪", label: "Peru",                maxDigits: 9,  format: fmt9       },
  { code: "+1",   flag: "🇺🇸", label: "EUA / Canadá",        maxDigits: 10, format: fmt10_3   },
  { code: "+598", flag: "🇺🇾", label: "Uruguai",             maxDigits: 8,  format: fmt8       },
  { code: "+58",  flag: "🇻🇪", label: "Venezuela",           maxDigits: 10, format: fmt10_2   },
  // ─ Europa ─
  { code: "+49",  flag: "🇩🇪", label: "Alemanha",            maxDigits: 11, format: fmt11_de  },
  { code: "+32",  flag: "🇧🇪", label: "Bélgica",             maxDigits: 10, format: fmt10_au  },
  { code: "+34",  flag: "🇪🇸", label: "Espanha",             maxDigits: 9,  format: fmt9       },
  { code: "+33",  flag: "🇫🇷", label: "França",              maxDigits: 10, format: fmt10_au  },
  { code: "+39",  flag: "🇮🇹", label: "Itália",              maxDigits: 10, format: fmt10_in  },
  { code: "+31",  flag: "🇳🇱", label: "Países Baixos",       maxDigits: 9,  format: fmt9       },
  { code: "+351", flag: "🇵🇹", label: "Portugal",            maxDigits: 9,  format: fmt9       },
  { code: "+44",  flag: "🇬🇧", label: "Reino Unido",         maxDigits: 11, format: fmt11_uk  },
  { code: "+41",  flag: "🇨🇭", label: "Suíça",               maxDigits: 9,  format: fmt9       },
  // ─ Ásia / Oceania ─
  { code: "+61",  flag: "🇦🇺", label: "Austrália",           maxDigits: 10, format: fmt10_au  },
  { code: "+86",  flag: "🇨🇳", label: "China",               maxDigits: 11, format: fmt11_de  },
  { code: "+91",  flag: "🇮🇳", label: "Índia",               maxDigits: 10, format: fmt10_in  },
  { code: "+81",  flag: "🇯🇵", label: "Japão",               maxDigits: 11, format: fmt11_de  },
];

// ── Parser ────────────────────────────────────────────────────────────────────

/** Parses a stored phone string (e.g. "+55 (11) 99999-9999") into code and digits. */
function parseValue(value: string): { code: string; digits: string } {
  if (!value) return { code: "+55", digits: "" };
  // Sort longest code first to avoid "+5" matching "+55" etc.
  const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sorted) {
    if (value.startsWith(c.code)) {
      const rest = value.slice(c.code.length).trimStart();
      return { code: c.code, digits: rest.replace(/\D/g, "") };
    }
  }
  return { code: "+55", digits: value.replace(/\D/g, "") };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PhoneInputProps {
  /** Full phone value: "+55 (11) 99999-9999". */
  value: string;
  /** Called with the new combined value on every change. */
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  required?: boolean;
}

/**
 * Phone input with country code selector (32 countries) and automatic masking.
 * Stored value format: "+{code} {masked number}" — e.g. "+55 (11) 99999-9999".
 *
 * @param value    - Current phone string with country prefix.
 * @param onChange - Called with updated phone string on every change.
 * @param id       - Optional id for the number input (for label association).
 */
export function PhoneInput({ value, onChange, id, className, required }: PhoneInputProps) {
  const { code, digits } = parseValue(value);
  const country = COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];

  function emit(newCode: string, newDigits: string, def: CountryDef) {
    const masked = def.format(newDigits);
    onChange(masked ? `${newCode} ${masked}` : newCode);
  }

  function handleCodeChange(newCode: string) {
    const newCountry = COUNTRIES.find((c) => c.code === newCode) ?? COUNTRIES[0];
    emit(newCode, digits.slice(0, newCountry.maxDigits), newCountry);
  }

  function handleNumberChange(raw: string) {
    const newDigits = raw.replace(/\D/g, "").slice(0, country.maxDigits);
    emit(code, newDigits, country);
  }

  const placeholder =
    code === "+55"  ? "(11) 99999-9999" :
    code === "+1"   ? "(555) 000-0000"  :
    code === "+54"  ? "(11) 5555-5555"  :
    "número";

  return (
    <div
      className={cn(
        "flex h-10 w-full rounded-md border border-input overflow-hidden ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className
      )}
    >
      <select
        value={code}
        onChange={(e) => handleCodeChange(e.target.value)}
        className="shrink-0 h-full border-r border-input bg-muted/40 px-2 text-sm focus:outline-none text-foreground cursor-pointer"
        aria-label="Código do país"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        required={required}
        value={country.format(digits)}
        onChange={(e) => handleNumberChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  );
}
