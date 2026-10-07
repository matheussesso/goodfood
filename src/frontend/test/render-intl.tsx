import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import messages from "@/messages/pt.json";
import { createTestQueryClient } from "./query-utils";

/**
 * Renders a component inside the pt locale and a fresh QueryClient.
 *
 * @param ui - Element under test.
 * @param client - Optional pre-seeded QueryClient.
 * @returns Testing Library's render result plus the client.
 */
export function renderWithProviders(ui: ReactElement, client: QueryClient = createTestQueryClient()) {
  return {
    client,
    ...render(
      <NextIntlClientProvider locale="pt" messages={messages}>
        <QueryClientProvider client={client}>{ui}</QueryClientProvider>
      </NextIntlClientProvider>
    ),
  };
}

export { messages };
