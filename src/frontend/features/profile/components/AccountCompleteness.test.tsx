import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, messages } from "@/test/render-intl";
import { getCompleteness } from "@/features/profile/completeness";
import { AccountCompleteness } from "./AccountCompleteness";

const P = messages.Profile;

describe("AccountCompleteness", () => {
  it("links only the pending items to where they are completed", () => {
    renderWithProviders(<AccountCompleteness completeness={getCompleteness({ phone: "11999999999", petsCount: 0 })} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");
    expect(screen.queryByRole("link", { name: P.item_contact })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: P.item_address })).toHaveAttribute("href", "/profile?section=address");
    expect(screen.getByRole("link", { name: P.item_pet })).toHaveAttribute("href", "/pets/new");
  });

  it("collapses to a success message when complete", () => {
    renderWithProviders(
      <AccountCompleteness completeness={getCompleteness({ phone: "11999999999", street: "Rua A", city: "SP", petsCount: 1 })} />
    );

    expect(screen.getByRole("status")).toHaveTextContent(P.completeness_done);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
