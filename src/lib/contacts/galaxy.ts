import type { Address, Contact } from "./types";

export type GalaxyMode = "company" | "location";

export interface GalaxyConnection {
  sourceId: number;
  targetId: number;
  label: string;
}

export interface GalaxyPoint {
  x: number;
  y: number;
}

function normalized(value: string | null | undefined): string {
  return value?.trim().toLocaleLowerCase() ?? "";
}

function displayValue(
  left: string | null | undefined,
  right: string | null | undefined,
): string {
  return left?.trim() || right?.trim() || "";
}

function sharedAddressLabel(left: Address[], right: Address[]): string | null {
  const levels: (keyof Pick<Address, "city" | "state" | "country">)[] = [
    "city",
    "state",
    "country",
  ];

  for (const level of levels) {
    for (const leftAddress of left) {
      for (const rightAddress of right) {
        if (
          normalized(leftAddress[level]) &&
          normalized(leftAddress[level]) === normalized(rightAddress[level])
        ) {
          return displayValue(leftAddress[level], rightAddress[level]);
        }
      }
    }
  }
  return null;
}

/** Build one strongest, deterministic relationship for every contact pair. */
export function galaxyConnections(
  contacts: Contact[],
  mode: GalaxyMode,
): GalaxyConnection[] {
  const ordered = [...contacts].sort((left, right) => left.id - right.id);
  const connections: GalaxyConnection[] = [];

  for (let leftIndex = 0; leftIndex < ordered.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < ordered.length; rightIndex += 1) {
      const left = ordered[leftIndex];
      const right = ordered[rightIndex];
      const label =
        mode === "company"
          ? normalized(left.company) === normalized(right.company) &&
            normalized(left.company)
            ? displayValue(left.company, right.company)
            : null
          : sharedAddressLabel(left.addresses, right.addresses);

      if (label) {
        connections.push({ sourceId: left.id, targetId: right.id, label });
      }
    }
  }
  return connections;
}

/** Stable elliptical positions prevent the graph jumping between renders. */
export function galaxyPositions(contacts: Contact[]): Map<number, GalaxyPoint> {
  const ordered = [...contacts].sort((left, right) => left.id - right.id);
  const points = new Map<number, GalaxyPoint>();
  if (ordered.length === 1) {
    points.set(ordered[0].id, { x: 50, y: 31 });
    return points;
  }

  ordered.forEach((contact, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / ordered.length;
    points.set(contact.id, {
      x: 50 + 38 * Math.cos(angle),
      y: 31 + 23 * Math.sin(angle),
    });
  });
  return points;
}
