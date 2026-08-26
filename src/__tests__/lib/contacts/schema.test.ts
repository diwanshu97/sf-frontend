import {
  CONTACT_FIELDS,
  contactInputSchema,
  formDataToValues,
  zodFieldErrors,
} from "@/lib/contacts/schema";

function values(overrides: Record<string, unknown> = {}) {
  return {
    first_name: "Ada",
    last_name: "Lovelace",
    email: "Ada@Example.com",
    phone: "",
    photo: "",
    company: "",
    job_title: "",
    addresses: [],
    notes: "",
    ...overrides,
  };
}

describe("contactInputSchema", () => {
  it("lowercases the email and nulls out the blanks", () => {
    const parsed = contactInputSchema.parse(values());

    expect(parsed.email).toBe("ada@example.com");
    expect(parsed.phone).toBeNull();
    expect(parsed.photo).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it("trims what the user typed", () => {
    expect(contactInputSchema.parse(values({ company: "  Acme  " })).company).toBe(
      "Acme",
    );
  });

  it("requires the three fields the API requires", () => {
    const result = contactInputSchema.safeParse(
      values({ first_name: " ", last_name: "", email: "" }),
    );

    expect(result.success).toBe(false);
    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name is required",
      last_name: "Last name is required",
      email: "Email is required",
    });
  });

  it("rejects a malformed email", () => {
    const result = contactInputSchema.safeParse(values({ email: "not-an-email" }));
    expect(zodFieldErrors(result.error!).email).toBe("Enter a valid email address");
  });

  it("enforces the API's length limits", () => {
    const result = contactInputSchema.safeParse(
      values({
        first_name: "a".repeat(101),
        addresses: [
          {
            type: "Home",
            street: "",
            city: "",
            state: "",
            postal_code: "9".repeat(21),
            country: "",
          },
        ],
      }),
    );

    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name must be 100 characters or fewer",
      "addresses.0.postal_code": "Postal code must be 20 characters or fewer",
    });
  });

  it("normalizes multiple typed addresses", () => {
    const parsed = contactInputSchema.parse(
      values({
        addresses: [
          {
            type: "Home",
            street: "  1 Main St  ",
            city: "",
            state: "CA",
            postal_code: "",
            country: "USA",
          },
          {
            type: "Work",
            street: "",
            city: "  London ",
            state: "",
            postal_code: "",
            country: "UK",
          },
        ],
      }),
    );

    expect(parsed.addresses).toEqual([
      {
        type: "Home",
        street: "1 Main St",
        city: null,
        state: "CA",
        postal_code: null,
        country: "USA",
      },
      {
        type: "Work",
        street: null,
        city: "London",
        state: null,
        postal_code: null,
        country: "UK",
      },
    ]);
  });

  it("rejects an empty address and unsupported type", () => {
    const empty = contactInputSchema.safeParse(
      values({
        addresses: [
          { type: "Home", street: "", city: "", state: "", postal_code: "", country: "" },
        ],
      }),
    );
    expect(zodFieldErrors(empty.error!)["addresses.0.street"]).toBe(
      "Enter at least one address field",
    );

    const invalidType = contactInputSchema.safeParse(
      values({ addresses: [{ type: "Vacation", city: "Paris" }] }),
    );
    expect(zodFieldErrors(invalidType.error!)["addresses.0.type"]).toBeDefined();
  });

  it("accepts supported image data URLs and rejects other content", () => {
    const png = "data:image/png;base64,iVBORw0KGgo=";
    expect(contactInputSchema.parse(values({ photo: png })).photo).toBe(png);

    const result = contactInputSchema.safeParse(
      values({ photo: "data:image/svg+xml;base64,PHN2Zz4=" }),
    );
    expect(zodFieldErrors(result.error!).photo).toBe(
      "Photo must be a JPEG, PNG, or WebP image",
    );
  });
});

describe("formDataToValues", () => {
  it("pulls scalar fields and an indexed address collection", () => {
    const formData = new FormData();
    formData.set("first_name", "Grace");
    formData.set("email", "grace@example.com");
    formData.set("address_count", "2");
    formData.set("addresses.0.type", "Home");
    formData.set("addresses.0.city", "Arlington");
    formData.set("addresses.1.type", "Work");
    formData.set("addresses.1.street", "1 Navy Way");
    formData.set("ignored", "nope");

    const extracted = formDataToValues(formData);

    expect(extracted.first_name).toBe("Grace");
    expect(extracted.last_name).toBe("");
    expect(extracted.photo).toBe("");
    expect(extracted.addresses).toEqual([
      {
        type: "Home",
        street: "",
        city: "Arlington",
        state: "",
        postal_code: "",
        country: "",
      },
      {
        type: "Work",
        street: "1 Navy Way",
        city: "",
        state: "",
        postal_code: "",
        country: "",
      },
    ]);
    expect(Object.keys(extracted).sort()).toEqual(
      [...CONTACT_FIELDS.map((field) => field.name), "photo", "addresses"].sort(),
    );
  });

  it("accepts a server-converted photo value", () => {
    const formData = new FormData();
    const photo = "data:image/png;base64,iVBORw0KGgo=";

    expect(formDataToValues(formData, photo).photo).toBe(photo);
  });
});
