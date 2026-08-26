import type { Metadata } from "next";
import ApiErrorPanel from "@/components/contacts/ApiErrorPanel";
import ContactGalaxy from "@/components/contacts/ContactGalaxy";
import { ApiUnreachableError, apiBaseUrl } from "@/lib/apiClient";
import { listContacts } from "@/lib/contacts/api";

export const metadata: Metadata = {
  title: "Contact Galaxy",
  description: "Explore connections across companies and locations.",
};

const GALAXY_LIMIT = 18;

export default async function NetworkPage() {
  const outcome = await listContacts({ limit: GALAXY_LIMIT }).catch(
    (error: unknown) => error as Error,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Network view
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">
          Contact Galaxy
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Discover the invisible links in your address book. People connect when
          they share a company or a city, state, or country across any saved address.
        </p>
      </header>

      {outcome instanceof Error ? (
        <ApiErrorPanel
          title="Could not map your network"
          message={
            outcome instanceof ApiUnreachableError
              ? "The Contacts API did not respond. Start the backend and reload."
              : outcome.message
          }
          hint={`API base URL: ${apiBaseUrl || "(same origin)"}`}
        />
      ) : outcome.items.length ? (
        <ContactGalaxy contacts={outcome.items} total={outcome.total} />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Your galaxy is waiting
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a few contacts to reveal their connections.
          </p>
        </div>
      )}
    </div>
  );
}
