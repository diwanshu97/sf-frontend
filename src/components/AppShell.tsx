"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import VersionFooter from "@/components/VersionFooter";

const NAV_LINKS: {
  label: string;
  compactLabel?: string;
  href: string;
  match: (pathname: string) => boolean;
}[] = [
  {
    label: "Contacts",
    href: "/contacts",
    match: (path) => path.startsWith("/contacts") && path !== "/contacts/new",
  },
  {
    label: "New contact",
    compactLabel: "New",
    href: "/contacts/new",
    match: (path) => path === "/contacts/new",
  },
  {
    label: "Galaxy",
    href: "/network",
    match: (path) => path === "/network",
  },
];

function Wordmark() {
  return (
    <span className="font-display text-base font-bold leading-none tracking-tight text-foreground">
      <span aria-hidden="true" className="sm:hidden">
        SF
      </span>
      <span aria-hidden="true" className="hidden sm:inline">
        SF<span className="text-primary">Contacts</span>
      </span>
      <span className="sr-only">SF Contacts</span>
    </span>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // `trailingSlash: true` means the live pathname is "/contacts/", so normalise
  // before matching rather than comparing the raw string.
  const currentPath = pathname.replace(/\/+$/, "") || "/";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-hairline bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-2 sm:gap-6 sm:px-4">
          <Link href="/contacts" className="flex items-center gap-2">
            <Wordmark />
          </Link>

          <nav
            aria-label="Primary navigation"
            className="flex items-center text-xs sm:gap-1 sm:text-sm"
          >
            {NAV_LINKS.map((link) => {
              const active = link.match(currentPath);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-label={link.label}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-1.5 py-1.5 transition-colors sm:px-2.5 ${
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  {link.compactLabel ? (
                    <>
                      <span className="sm:hidden">{link.compactLabel}</span>
                      <span className="hidden sm:inline">{link.label}</span>
                    </>
                  ) : (
                    link.label
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <VersionFooter />
    </div>
  );
}
