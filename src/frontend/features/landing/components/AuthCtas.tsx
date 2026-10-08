"use client";

import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { landingButton, type LandingButtonVariant } from "@/features/landing/button-styles";

export interface AuthCtaLabels {
  login: string;
  register: string;
  dashboard: string;
}

interface AuthCtasProps {
  labels: AuthCtaLabels;
  /** Style of the primary button (depends on the section background). */
  primaryVariant?: LandingButtonVariant;
  /** Style of the secondary button. */
  secondaryVariant?: LandingButtonVariant;
  large?: boolean;
  /** Hide the secondary (login) button, e.g. in the compact header. */
  hideSecondary?: boolean;
  className?: string;
}

/**
 * Sign-up / sign-in buttons that turn into a single "go to my panel" button
 * once the visitor has a session. Labels come from the server so this island
 * does not depend on the locale's message bundle.
 *
 * @param labels - Button texts.
 * @param primaryVariant - Primary button style.
 * @param secondaryVariant - Secondary button style.
 * @param large - Use the large button size.
 * @param hideSecondary - Render only the primary button.
 * @param className - Wrapper classes.
 */
export function AuthCtas({ labels, primaryVariant = "primary", secondaryVariant = "secondary", large = false, hideSecondary = false, className }: AuthCtasProps) {
  const user = useAuth((state) => state.user);

  if (user) {
    return (
      <div className={className}>
        <Link href="/dashboard" className={landingButton(primaryVariant, large)}>
          {labels.dashboard} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className={className}>
      <Link href="/register" className={landingButton(primaryVariant, large)}>
        {labels.register} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      {!hideSecondary && (
        <Link href="/login" className={landingButton(secondaryVariant, large)}>
          {labels.login}
        </Link>
      )}
    </div>
  );
}
