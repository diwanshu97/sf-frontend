import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactForm from "@/components/contacts/ContactForm";
import { makeContact } from "../mocks/handlers";
import type { FormState } from "@/lib/contacts/types";

const PNG_PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function renderForm(action: jest.Mock, contact?: ReturnType<typeof makeContact>) {
  return render(
    <ContactForm
      action={action as never}
      contact={contact}
      submitLabel="Create contact"
      cancelHref="/contacts"
    />,
  );
}

describe("ContactForm", () => {
  it("renders scalar fields and the empty address editor", () => {
    renderForm(jest.fn());

    expect(screen.getByLabelText(/first name/i)).toBeRequired();
    expect(screen.getByLabelText(/last name/i)).toBeRequired();
    expect(screen.getByLabelText(/^email/i)).toBeRequired();
    expect(screen.getByLabelText(/phone/i)).not.toBeRequired();
    expect(screen.getByLabelText(/choose photo/i)).toHaveAttribute(
      "accept",
      "image/jpeg,image/png,image/webp",
    );
    expect(screen.getByLabelText(/choose photo/i)).toHaveAttribute(
      "name",
      "photo_file",
    );
    expect(screen.getByLabelText(/notes/i).tagName).toBe("TEXTAREA");
    expect(screen.getByText("No addresses added.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add address/i })).toBeEnabled();
  });

  it("prefills from an existing contact", () => {
    renderForm(jest.fn(), makeContact());

    expect(screen.getByLabelText(/first name/i)).toHaveValue("Ada");
    expect(screen.getByLabelText(/^email/i)).toHaveValue("ada@example.com");
    // Nulls become empty inputs rather than the string "null".
    expect(screen.getByLabelText(/street address/i)).toHaveValue("");
    expect(screen.getByLabelText(/city/i)).toHaveValue("San Francisco");
    expect(screen.getByLabelText(/address type/i)).toHaveValue("Home");
  });

  it("adds, removes, and submits indexed typed addresses", async () => {
    const action = jest.fn<Promise<FormState>, [FormState, FormData]>(
      async () => ({ status: "idle" }),
    );
    renderForm(action);

    await userEvent.click(screen.getByRole("button", { name: /add address/i }));
    await userEvent.type(screen.getByLabelText(/street address/i), "10 Main St");
    await userEvent.click(screen.getByRole("button", { name: /add address/i }));

    const types = screen.getAllByLabelText(/address type/i);
    const cities = screen.getAllByLabelText(/^city$/i);
    await userEvent.selectOptions(types[1], "Work");
    await userEvent.type(cities[1], "New York");

    await userEvent.click(screen.getByRole("button", { name: /remove address 1/i }));
    expect(screen.getAllByLabelText(/address type/i)).toHaveLength(1);
    expect(screen.getByLabelText(/address type/i)).toHaveValue("Work");
    expect(screen.getByLabelText(/^city$/i)).toHaveValue("New York");

    await userEvent.type(screen.getByLabelText(/first name/i), "Grace");
    await userEvent.type(screen.getByLabelText(/last name/i), "Hopper");
    await userEvent.type(screen.getByLabelText(/^email/i), "grace@example.com");
    await userEvent.click(screen.getByRole("button", { name: /create contact/i }));

    await waitFor(() => expect(action).toHaveBeenCalled());
    const formData = action.mock.calls[0][1];
    expect(formData.get("address_count")).toBe("1");
    expect(formData.get("addresses.0.type")).toBe("Work");
    expect(formData.get("addresses.0.city")).toBe("New York");
    expect(formData.get("addresses.1.type")).toBeNull();
  });

  it("preserves edited address values when an action returns an error", async () => {
    const action = jest.fn(
      async (): Promise<FormState> => ({
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: { email: "Email is required" },
      }),
    );
    renderForm(action, makeContact());

    const street = screen.getByLabelText(/street address/i);
    const city = screen.getByLabelText(/^city$/i);
    await userEvent.type(street, "55 Error-Proof Ave");
    await userEvent.clear(city);
    await userEvent.type(city, "Oakland");
    await userEvent.click(screen.getByRole("button", { name: /create contact/i }));

    await screen.findByText("Please fix the highlighted fields.");
    expect(screen.getByLabelText(/street address/i)).toHaveValue(
      "55 Error-Proof Ave",
    );
    expect(screen.getByLabelText(/^city$/i)).toHaveValue("Oakland");
  });

  it("submits the entered values to the action", async () => {
    const action = jest.fn<Promise<FormState>, [FormState, FormData]>(
      async () => ({ status: "idle" }),
    );
    renderForm(action);

    await userEvent.type(screen.getByLabelText(/first name/i), "Grace");
    await userEvent.type(screen.getByLabelText(/last name/i), "Hopper");
    await userEvent.type(screen.getByLabelText(/^email/i), "grace@example.com");
    await userEvent.click(screen.getByRole("button", { name: /create contact/i }));

    await waitFor(() => expect(action).toHaveBeenCalled());

    const formData = action.mock.calls[0][1];
    expect(formData.get("first_name")).toBe("Grace");
    expect(formData.get("email")).toBe("grace@example.com");
    expect(formData.get("photo")).toBe("");
  });

  it("preserves an existing photo through an edit submission", async () => {
    const action = jest.fn<Promise<FormState>, [FormState, FormData]>(
      async () => ({ status: "idle" }),
    );
    renderForm(action, makeContact({ photo: PNG_PHOTO }));

    expect(
      screen.getByRole("img", { name: /contact photo preview/i }),
    ).toHaveAttribute("src", PNG_PHOTO);
    await userEvent.click(screen.getByRole("button", { name: /create contact/i }));
    await waitFor(() => expect(action).toHaveBeenCalled());

    expect(action.mock.calls[0][1].get("photo")).toBe(PNG_PHOTO);
  });

  it("converts a selected image to a data URL and can remove it", async () => {
    const action = jest.fn<Promise<FormState>, [FormState, FormData]>(
      async () => ({ status: "idle" }),
    );
    renderForm(action, makeContact());
    const image = new File(
      [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
      "avatar.png",
      { type: "image/png" },
    );

    await userEvent.upload(screen.getByLabelText(/choose photo/i), image);
    expect(
      await screen.findByRole("img", { name: /contact photo preview/i }),
    ).toHaveAttribute("src", expect.stringMatching(/^data:image\/png;base64,/));

    await userEvent.click(screen.getByRole("button", { name: /^remove$/i }));
    expect(
      screen.queryByRole("img", { name: /contact photo preview/i }),
    ).not.toBeInTheDocument();
  });

  it("rejects files larger than 2 MiB before submission", async () => {
    renderForm(jest.fn(), makeContact());
    const image = new File(["x"], "large.png", { type: "image/png" });
    Object.defineProperty(image, "size", { value: 2 * 1024 * 1024 + 1 });

    await userEvent.upload(screen.getByLabelText(/choose photo/i), image);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Choose an image no larger than 2 MiB.",
    );
  });

  it("disables submission while the selected photo is being read", async () => {
    const read = jest
      .spyOn(FileReader.prototype, "readAsDataURL")
      .mockImplementation(() => undefined);
    renderForm(jest.fn(), makeContact());
    const image = new File(["image"], "avatar.png", { type: "image/png" });

    await userEvent.upload(screen.getByLabelText(/choose photo/i), image);

    expect(screen.getByRole("button", { name: /preparing photo/i })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Preparing photo…");
    read.mockRestore();
  });

  it("shows the summary and the per-field errors the action returns", async () => {
    const action = jest.fn(
      async (): Promise<FormState> => ({
        status: "error",
        message: "That email address is already taken.",
        fieldErrors: { email: "This email is already in use." },
        values: { first_name: "Grace" },
      }),
    );
    renderForm(action);

    await userEvent.click(screen.getByRole("button", { name: /create contact/i }));

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.map((node) => node.textContent)).toEqual(
      expect.arrayContaining([
        "That email address is already taken.",
        "This email is already in use.",
      ]),
    );
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("links back out without submitting", () => {
    renderForm(jest.fn());
    expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute(
      "href",
      "/contacts",
    );
  });
});
