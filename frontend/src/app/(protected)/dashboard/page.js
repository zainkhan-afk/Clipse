"use client";
import Link from "next/link";
import { ArrowUpRight, Clipboard } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useClipboards } from "@/context/ClipboardContext";
import { formatTTL } from "@/lib/ttl";

export default function Dashboard() {
  const { UserData } = useUser();
  const { ClipboardsData, loading } = useClipboards();

  const clipboards = ClipboardsData ?? [];
  const greeting = getGreeting();

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <header className="animate-rise">
        <p className="font-mono text-xs uppercase tracking-wider text-faint">{greeting}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {UserData?.first_name ? `Hi, ${UserData.first_name}.` : "Your clipboards"}
        </h1>
        <p className="mt-2 max-w-prose text-[15px] text-muted">
          Pick a clipboard to read or drop something new. Anything you add is ready on every
          device the moment you paste it.
        </p>
      </header>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
            Clipboards{" "}
            {!loading && (
              <span className="ml-1 font-mono text-xs text-faint">({clipboards.length})</span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-line bg-raised/50" />
            ))}
          </div>
        ) : clipboards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
            <p className="text-sm text-muted">No clipboards yet.</p>
            <p className="mt-1 text-xs text-faint">
              Create one from the sidebar to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clipboards.map((c, i) => (
              <Link
                key={c.id}
                href={`/clipboards/${c.slug}`}
                style={{ animationDelay: `${i * 50}ms` }}
                className="group animate-rise rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)] transition-all hover:-translate-y-0.5 hover:border-line-strong"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-xl text-accent"
                    style={{ background: c.color ? `${c.color}22` : "var(--accent-soft)" }}
                  >
                    <Clipboard className="h-5 w-5" style={c.color ? { color: c.color } : undefined} />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-faint transition-colors group-hover:text-accent" />
                </div>
                <h3 className="mt-4 flex items-center gap-2 text-base font-medium">
                  {c.color && (
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                  )}
                  <span className="truncate">{c.name}</span>
                </h3>
                {c.persistance ? (
                  <p className="mt-1 font-mono text-xs text-faint">{formatTTL(c.persistance)}</p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
