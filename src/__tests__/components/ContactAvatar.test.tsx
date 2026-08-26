import React from "react";
import { render } from "@testing-library/react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import { makeContact } from "../mocks/handlers";

const PNG_PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

describe("ContactAvatar", () => {
  it("renders a circular profile photo when one is available", () => {
    const { container } = render(
      <ContactAvatar contact={makeContact({ photo: PNG_PHOTO })} />,
    );

    expect(container.firstChild).toHaveClass("rounded-full", "overflow-hidden");
    expect(container.querySelector("img")).toHaveAttribute("src", PNG_PHOTO);
  });

  it("falls back to initials when there is no photo", () => {
    const { container } = render(<ContactAvatar contact={makeContact()} />);

    expect(container).toHaveTextContent("AL");
    expect(container.querySelector("img")).toBeNull();
  });
});
