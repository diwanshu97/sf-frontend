"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Sparkles } from "lucide-react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import {
  galaxyConnections,
  galaxyPositions,
  type GalaxyMode,
} from "@/lib/contacts/galaxy";
import type { Contact } from "@/lib/contacts/types";

const MODES: { value: GalaxyMode; label: string; icon: typeof Building2 }[] = [
  { value: "location", label: "Location", icon: MapPin },
  { value: "company", label: "Company", icon: Building2 },
];

export default function ContactGalaxy({
  contacts,
  total,
}: {
  contacts: Contact[];
  total: number;
}) {
  const [mode, setMode] = useState<GalaxyMode>("location");
  const positions = galaxyPositions(contacts);
  const connections = galaxyConnections(contacts, mode);
  const connectionNoun = connections.length === 1 ? "connection" : "connections";
  const modePlural = mode === "company" ? "companies" : "locations";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            {contacts.length} people
          </span>
          <span>
            {connections.length} {connectionNoun}
          </span>
          {total > contacts.length ? <span>showing the first {contacts.length}</span> : null}
        </div>

        <div
          className="inline-flex rounded-md border border-border bg-card p-1"
          aria-label="Connection mode"
        >
          {MODES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${
                mode === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative min-h-[31rem] overflow-hidden rounded-xl border border-border bg-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(var(--primary)/0.10),transparent_55%)]" />
        {[12, 28, 44, 63, 78, 91].map((left, index) => (
          <span
            key={left}
            aria-hidden="true"
            className="absolute h-1 w-1 rounded-full bg-primary/40"
            style={{ left: `${left}%`, top: `${15 + ((index * 19) % 68)}%` }}
          />
        ))}

        <svg
          aria-hidden="true"
          viewBox="0 0 100 62"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {connections.map((connection) => {
            const source = positions.get(connection.sourceId)!;
            const target = positions.get(connection.targetId)!;
            return (
              <g key={`${connection.sourceId}-${connection.targetId}`}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  className="stroke-primary/45"
                  strokeWidth="0.35"
                  strokeDasharray="1 0.8"
                />
                <circle
                  cx={(source.x + target.x) / 2}
                  cy={(source.y + target.y) / 2}
                  r="0.8"
                  className="fill-primary"
                />
              </g>
            );
          })}
        </svg>

        {contacts.map((contact) => {
          const point = positions.get(contact.id)!;
          const reasons = connections
            .filter(
              (connection) =>
                connection.sourceId === contact.id || connection.targetId === contact.id,
            )
            .map((connection) => connection.label);

          return (
            <Link
              key={contact.id}
              href={`/contacts/${contact.id}`}
              aria-label={`Open ${contact.full_name}`}
              className="group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${point.x}%`, top: `${(point.y / 62) * 100}%` }}
            >
              <span className="rounded-full border-2 border-primary/50 bg-background p-1 shadow-[0_0_28px_rgb(var(--primary)/0.25)] transition-transform group-hover:scale-110 group-focus-visible:scale-110">
                <ContactAvatar contact={contact} size="lg" />
              </span>
              <span className="mt-2 max-w-32 truncate rounded-full border border-border bg-background/95 px-2.5 py-1 text-center text-xs font-medium text-foreground shadow-sm">
                {contact.full_name}
              </span>
              <span className="pointer-events-none absolute top-full mt-2 hidden w-44 rounded-md border border-border bg-popover px-3 py-2 text-center text-[11px] text-muted-foreground shadow-lg group-hover:block group-focus-visible:block">
                {reasons.length
                  ? `Connected through ${[...new Set(reasons)].join(", ")}`
                  : `No shared ${mode} yet`}
              </span>
            </Link>
          );
        })}

        {connections.length === 0 && contacts.length > 1 ? (
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border bg-background/90 px-4 py-2 text-xs text-muted-foreground">
            No shared {modePlural} yet. Add a colleague or a nearby contact.
          </p>
        ) : null}

        <ul className="sr-only">
          {connections.map((connection) => {
            const source = contacts.find((contact) => contact.id === connection.sourceId)!;
            const target = contacts.find((contact) => contact.id === connection.targetId)!;
            return (
              <li key={`${connection.sourceId}-${connection.targetId}-description`}>
                {source.full_name} and {target.full_name} are connected through {connection.label}.
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
