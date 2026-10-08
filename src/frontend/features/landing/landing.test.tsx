import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider, createTranslator } from "next-intl";
import messages from "@/messages/pt.json";
import { useAuth, type User } from "@/hooks/useAuth";
import { FAQ_IDS, HOW_STEPS, NAV_ITEMS, PROCESS_STEPS, SYSTEM_FEATURES } from "./content";
import { buildFaqJsonLd, buildOrganizationJsonLd, serializeJsonLd } from "./json-ld";
import { About } from "./components/About";
import { AuthCtas } from "./components/AuthCtas";
import { Faq } from "./components/Faq";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { LandingHeader } from "./components/LandingHeader";
import { Plans } from "./components/Plans";
import { SystemShowcase } from "./components/SystemShowcase";
import { WhatsAppFab } from "./components/WhatsAppFab";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

// Server components read their copy through next-intl/server; outside Next there is
// no request scope, so build the same translators straight from the pt messages.
vi.mock("next-intl/server", () => ({
  getTranslations: async ({ namespace }: { namespace: string }) => createTranslator({ locale: "pt", messages, namespace } as never),
}));

const L = messages.Landing;
const labels = { login: L.cta.login, register: L.cta.register_free, dashboard: L.cta.dashboard };

/** Async server components cannot be rendered by RTL directly: resolve them first. */
async function renderServer(component: Promise<ReactElement>) {
  return render(<NextIntlClientProvider locale="pt" messages={messages}>{await component}</NextIntlClientProvider>);
}

beforeEach(() => {
  useAuth.setState({ user: null, isAuthenticated: false });
});

describe("landing content integrity", () => {
  const section = (obj: Record<string, unknown>, id: string) => obj[id] as Record<string, string> | undefined;

  it("has copy for every item the page renders", () => {
    PROCESS_STEPS.forEach(({ id }) => expect(section(L.process.steps, id)?.title, `process.${id}`).toBeTruthy());
    HOW_STEPS.forEach(({ id }) => expect(section(L.how.steps, id)?.title, `how.${id}`).toBeTruthy());
    SYSTEM_FEATURES.forEach(({ id }) => expect(section(L.system.features, id)?.desc, `system.${id}`).toBeTruthy());
    NAV_ITEMS.forEach(({ labelKey }) => expect((L.nav as Record<string, string>)[labelKey], `nav.${labelKey}`).toBeTruthy());
    FAQ_IDS.forEach((id) => {
      const item = section(L.faq.items, id);
      expect(item?.q, `faq.${id}.q`).toBeTruthy();
      expect(item?.a, `faq.${id}.a`).toBeTruthy();
    });
  });

  it("points every nav anchor to a section id on the page", async () => {
    await renderServer(HowItWorks({ ctaLabels: labels }));
    await renderServer(SystemShowcase());
    await renderServer(About());
    await renderServer(Faq());
    for (const { anchor } of NAV_ITEMS) {
      expect(document.getElementById(anchor), `#${anchor}`).not.toBeNull();
    }
  });
});

describe("Hero", () => {
  it("sells the promise and offers sign-up, sign-in and WhatsApp", async () => {
    await renderServer(Hero({ ctaLabels: labels }));

    expect(screen.getByRole("heading", { level: 1, name: L.hero.title.replace(/<\/?hl>/g, "") })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(L.cta.register_free) })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: L.cta.login })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: new RegExp(L.cta.whatsapp) }).getAttribute("href")).toMatch(/^https:\/\/wa\.me\/5561981425385\?text=/);
    expect(screen.getByText(L.hero.badge_vets)).toBeInTheDocument();
    expect(screen.getAllByText(L.hero.badge_delivery).length).toBeGreaterThan(0);
  });
});

describe("AuthCtas", () => {
  it("shows a single 'go to my panel' button once there is a session", () => {
    useAuth.setState({ user: { id: 1, name: "Ana", email: "a@b.c", role: "customer" } as User });
    render(<AuthCtas labels={labels} />);

    expect(screen.getByRole("link", { name: new RegExp(L.cta.dashboard) })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("link", { name: L.cta.login })).not.toBeInTheDocument();
  });

  it("can hide the secondary button", () => {
    render(<AuthCtas labels={labels} hideSecondary />);
    expect(screen.queryByRole("link", { name: L.cta.login })).not.toBeInTheDocument();
  });
});

describe("sections", () => {
  it("keeps the institutional text short and lists the five production steps", async () => {
    await renderServer(About());
    expect(screen.getByText(L.about.p1)).toBeInTheDocument();
    expect(screen.queryByText(/Pretinha/)).not.toBeInTheDocument();

    const items = screen.getAllByRole("listitem").filter((li) => PROCESS_STEPS.some(({ id }) => li.textContent?.includes(L.process.steps[id as keyof typeof L.process.steps].title)));
    expect(items).toHaveLength(PROCESS_STEPS.length);
  });

  it("renders every FAQ entry as an expandable detail", async () => {
    const { container } = await renderServer(Faq());
    expect(container.querySelectorAll("details")).toHaveLength(FAQ_IDS.length);
    expect(screen.getByText(L.faq.items.q3.q)).toBeInTheDocument();
  });

  it("compares one-off orders and subscriptions and links the bone broth to WhatsApp", async () => {
    await renderServer(Plans());
    expect(screen.getByRole("heading", { name: L.plans.single.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: L.plans.subscription.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(L.cta.whatsapp) }).getAttribute("href")).toContain("wa.me/5561981425385");
  });

  it("shows the system features with their illustrative mocks", async () => {
    await renderServer(SystemShowcase());
    SYSTEM_FEATURES.forEach(({ id }) => {
      expect(screen.getByRole("heading", { name: (L.system.features as Record<string, { title: string }>)[id].title })).toBeInTheDocument();
    });
  });

  it("footer exposes contacts and the section links", async () => {
    await renderServer(Footer());
    expect(screen.getByRole("link", { name: /\(61\) 98142-5385/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /@goodfood\.pet/ })).toHaveAttribute("href", "https://www.instagram.com/goodfood.pet/");
    expect(screen.getByRole("link", { name: L.nav.faq })).toHaveAttribute("href", "#duvidas");
  });

  it("floating WhatsApp button has an accessible name", async () => {
    await renderServer(WhatsAppFab());
    expect(screen.getByRole("link", { name: L.a11y.whatsapp_fab })).toBeInTheDocument();
  });
});

describe("LandingHeader", () => {
  const props = {
    links: NAV_ITEMS.map((i) => ({ anchor: i.anchor, label: (L.nav as Record<string, string>)[i.labelKey] })),
    ctaLabels: labels,
    logoAlt: L.a11y.logo_alt,
    menuOpenLabel: L.a11y.menu_open,
    menuCloseLabel: L.a11y.menu_close,
    navLabel: L.a11y.main_nav,
  };

  it("toggles the mobile menu and closes it when a link is chosen", async () => {
    render(<LandingHeader {...props} />);
    const toggle = screen.getByRole("button", { name: L.a11y.menu_open });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: L.a11y.menu_close })).toHaveAttribute("aria-expanded", "true");

    const mobile = document.getElementById("landing-mobile-menu") as HTMLElement;
    await userEvent.click(within(mobile).getByRole("link", { name: L.nav.faq }));
    expect(document.getElementById("landing-mobile-menu")).toBeNull();
  });
});

describe("structured data and SEO routes", () => {
  it("builds FAQPage JSON-LD with every question", () => {
    const t = createTranslator({ locale: "pt", messages, namespace: "Landing.faq.items" } as never) as unknown as (k: string) => string;
    const faq = buildFaqJsonLd(t);

    expect(faq["@type"]).toBe("FAQPage");
    expect(faq.mainEntity).toHaveLength(FAQ_IDS.length);
    expect(faq.mainEntity[0].acceptedAnswer.text).toBe(L.faq.items.q1.a);
  });

  it("describes the organization with phone and social profiles", () => {
    const org = buildOrganizationJsonLd("desc");
    expect(org.telephone).toBe("+5561981425385");
    expect(org.address.addressLocality).toBe("Brasília");
    expect(org.sameAs).toContain("https://www.instagram.com/goodfood.pet/");
  });

  it("escapes '<' so JSON-LD can never close the script tag", () => {
    expect(serializeJsonLd({ a: "</script><b>" })).not.toContain("<");
  });

  it("sitemap lists the public pages with their Portuguese URLs", () => {
    const urls = sitemap().map((entry) => new URL(entry.url).pathname);
    expect(urls).toEqual(["/", "/entrar", "/cadastro"]);
  });

  it("robots blocks the authenticated areas and points to the sitemap", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules.disallow).toEqual(expect.arrayContaining(["/inicio", "/receitas", "/pedidos", "/admin"]));
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
