"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Sparkles } from "lucide-react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import {
  galaxyConnections,
  galaxyPositions,
  type GalaxyConnection,
  type GalaxyMode,
} from "@/lib/contacts/galaxy";
import type { Contact } from "@/lib/contacts/types";

const MODES: { value: GalaxyMode; label: string; icon: typeof Building2 }[] = [
  { value: "location", label: "Location", icon: MapPin },
  { value: "company", label: "Company", icon: Building2 },
];

function connectionKey(connection: GalaxyConnection): string {
  return `${connection.sourceId}-${connection.targetId}`;
}

export default function ContactGalaxy({
  contacts,
  total,
}: {
  contacts: Contact[];
  total: number;
}) {
  const [mode, setMode] = useState<GalaxyMode>("location");
  const [activeContactId, setActiveContactId] = useState<number | null>(null);
  const [activeConnectionKey, setActiveConnectionKey] = useState<string | null>(null);
  const positions = galaxyPositions(contacts);
  const connections = galaxyConnections(contacts, mode);
  const connectionNoun = connections.length === 1 ? "connection" : "connections";
  const modePlural = mode === "company" ? "companies" : "locations";
  const reasonsFor = (contactId: number) => [
    ...new Set(
      connections
        .filter(
          (connection) =>
            connection.sourceId === contactId || connection.targetId === contactId,
        )
        .map((connection) => connection.label),
    ),
  ];
  const activeContact = contacts.find((contact) => contact.id === activeContactId);
  const activeReasons = activeContact ? reasonsFor(activeContact.id) : [];
  const activeConnection = connections.find(
    (connection) => connectionKey(connection) === activeConnectionKey,
  );
  const activeConnectionSource = activeConnection
    ? contacts.find((contact) => contact.id === activeConnection.sourceId)
    : undefined;
  const activeConnectionTarget = activeConnection
    ? contacts.find((contact) => contact.id === activeConnection.targetId)
    : undefined;

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
              onClick={() => {
                setMode(value);
                setActiveContactId(null);
                setActiveConnectionKey(null);
              }}
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

      <section
        aria-label="Compact network"
        className="grid gap-3 sm:grid-cols-2 lg:hidden"
      >
        {contacts.map((contact) => {
          const reasons = reasonsFor(contact.id);
          return (
            <Link
              key={contact.id}
              href={`/contacts/${contact.id}`}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-secondary/40 focus-visible:border-primary"
            >
              <ContactAvatar contact={contact} size="md" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {contact.full_name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {reasons.length
                    ? `Connected through ${reasons.join(", ")}`
                    : `No shared ${mode} yet`}
                </span>
              </span>
            </Link>
          );
        })}
      </section>

      <section
        aria-label="Galaxy map"
        className="relative hidden min-h-[31rem] overflow-hidden rounded-xl border border-border bg-card lg:block"
      >
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
          aria-label="Interactive contact relationships"
          viewBox="0 0 100 62"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {connections.map((connection) => {
            const source = positions.get(connection.sourceId)!;
            const target = positions.get(connection.targetId)!;
            const sourceContact = contacts.find(
              (contact) => contact.id === connection.sourceId,
            )!;
            const targetContact = contacts.find(
              (contact) => contact.id === connection.targetId,
            )!;
            const key = connectionKey(connection);
            const active = key === activeConnectionKey;
            return (
              <g key={key}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  className={active ? "stroke-primary" : "stroke-primary/45"}
                  strokeWidth={active ? "0.75" : "0.35"}
                  strokeDasharray="1 0.8"
                  pointerEvents="none"
                />
                <circle
                  cx={(source.x + target.x) / 2}
                  cy={(source.y + target.y) / 2}
                  r={active ? "1.15" : "0.8"}
                  className={active ? "fill-primary" : "fill-primary/80"}
                  pointerEvents="none"
                />
                <line
                  data-testid={`galaxy-edge-${key}`}
                  role="img"
                  aria-label={`${sourceContact.full_name} and ${targetContact.full_name} are connected through ${connection.label}`}
                  tabIndex={0}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="transparent"
                  strokeWidth="4"
                  pointerEvents="stroke"
                  onMouseEnter={() => setActiveConnectionKey(key)}
                  onMouseLeave={() => setActiveConnectionKey(null)}
                  onFocus={() => setActiveConnectionKey(key)}
                  onBlur={() => setActiveConnectionKey(null)}
                  className="cursor-help outline-none"
                />
              </g>
            );
          })}
        </svg>

        {activeConnection && activeConnectionSource && activeConnectionTarget ? (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-30 w-max max-w-72 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary/40 bg-popover px-3 py-2 text-center shadow-xl"
            style={{
              left: `${
                (positions.get(activeConnection.sourceId)!.x +
                  positions.get(activeConnection.targetId)!.x) /
                2
              }%`,
              top: `${
                ((positions.get(activeConnection.sourceId)!.y +
                  positions.get(activeConnection.targetId)!.y) /
                  2 /
                  62) *
                100
              }%`,
            }}
          >
            <p className="text-xs font-semibold text-foreground">
              {activeConnectionSource.full_name} ↔ {activeConnectionTarget.full_name}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Shared {mode}: <span className="text-primary">{activeConnection.label}</span>
            </p>
          </div>
        ) : null}

        {contacts.map((contact) => {
          const point = positions.get(contact.id)!;
          const reasons = reasonsFor(contact.id);
          const relationship = reasons.length
            ? `Connected through ${reasons.join(", ")}`
            : `No shared ${mode} yet`;

          return (
            <Link
              key={contact.id}
              href={`/contacts/${contact.id}`}
              aria-label={`Open ${contact.full_name}. ${relationship}`}
              onMouseEnter={() => setActiveContactId(contact.id)}
              onMouseLeave={() => setActiveContactId(null)}
              onFocus={() => setActiveContactId(contact.id)}
              onBlur={() => setActiveContactId(null)}
              className="group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${point.x}%`, top: `${(point.y / 62) * 100}%` }}
            >
              <span className="rounded-full border-2 border-primary/50 bg-background p-1 shadow-[0_0_28px_rgb(var(--primary)/0.25)] transition-transform group-hover:scale-110 group-focus-visible:scale-110">
                <ContactAvatar contact={contact} size="md" />
              </span>
              <span className="mt-2 max-w-24 truncate rounded-full border border-border bg-background/95 px-2 py-1 text-center text-[11px] font-medium text-foreground shadow-sm">
                {contact.full_name}
              </span>
            </Link>
          );
        })}

        <div
          aria-live="polite"
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-72 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background/95 px-4 py-3 text-center shadow-lg backdrop-blur"
        >
          {activeContact ? (
            <>
              <p className="truncate text-sm font-semibold text-foreground">
                {activeContact.full_name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {activeReasons.length
                  ? `Connected through ${activeReasons.join(", ")}`
                  : `No shared ${mode} yet`}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">Explore a connection</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Hover or focus a person or line to reveal the relationship.
              </p>
            </>
          )}
        </div>

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
      </section>
    </div>
  );
}
