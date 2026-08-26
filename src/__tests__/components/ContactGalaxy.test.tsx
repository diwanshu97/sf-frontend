import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactGalaxy from "@/components/contacts/ContactGalaxy";
import { makeContact } from "../mocks/handlers";

describe("ContactGalaxy", () => {
  it("switches relationship modes without moving or duplicating people", async () => {
    const contacts = [
      makeContact({ id: 1, company: "Acme", full_name: "Ada Lovelace" }),
      makeContact({
        id: 2,
        company: "Acme",
        first_name: "Grace",
        last_name: "Hopper",
        full_name: "Grace Hopper",
      }),
    ];
    render(<ContactGalaxy contacts={contacts} total={contacts.length} />);

    expect(screen.getByText("1 connection")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /^Open / })).toHaveLength(2);
    expect(
      screen.getAllByText(/connected through San Francisco/i).length,
    ).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "Company" }));

    expect(screen.getByRole("button", { name: "Company" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByText(/connected through Acme/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /^Open / })).toHaveLength(2);
  });
});
