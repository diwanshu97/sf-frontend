import { galaxyConnections, galaxyPositions } from "@/lib/contacts/galaxy";
import { makeContact } from "../../mocks/handlers";

describe("galaxyConnections", () => {
  it("connects matching companies once regardless of input order", () => {
    const contacts = [
      makeContact({ id: 2, company: "  Acme ", full_name: "Grace Hopper" }),
      makeContact({ id: 1, company: "ACME", full_name: "Ada Lovelace" }),
    ];

    expect(galaxyConnections(contacts, "company")).toEqual([
      { sourceId: 1, targetId: 2, label: "ACME" },
    ]);
  });

  it("uses the most specific shared address value", () => {
    const contacts = [
      makeContact({
        id: 1,
        addresses: [
          { id: 1, type: "Home", street: null, city: "Oakland", state: "CA", postal_code: null, country: "USA" },
        ],
      }),
      makeContact({
        id: 2,
        addresses: [
          { id: 2, type: "Work", street: null, city: "Oakland", state: "CA", postal_code: null, country: "USA" },
        ],
      }),
    ];

    expect(galaxyConnections(contacts, "location")[0].label).toBe("Oakland");
  });

  it("falls back to a shared country and ignores missing values", () => {
    const contacts = [
      makeContact({ id: 1 }),
      makeContact({
        id: 2,
        addresses: [
          { id: 2, type: "Other", street: null, city: null, state: null, postal_code: null, country: " usa " },
        ],
      }),
      makeContact({ id: 3, addresses: [] }),
    ];

    expect(galaxyConnections(contacts, "location")).toEqual([
      { sourceId: 1, targetId: 2, label: "USA" },
    ]);
  });
});

describe("galaxyPositions", () => {
  it("centers one contact and remains stable for reordered input", () => {
    const one = makeContact();
    expect(galaxyPositions([one]).get(one.id)).toEqual({ x: 50, y: 31 });

    const two = makeContact({ id: 2 });
    expect(galaxyPositions([two, one])).toEqual(galaxyPositions([one, two]));
  });
});
