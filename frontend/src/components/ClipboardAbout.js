"use client";

export default function ClipboardAbout({ clipboard, count = 0 }) {
  if (!clipboard) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <div className="h-4 w-20 animate-pulse rounded bg-raised" />
        <div className="mt-4 h-3 w-full animate-pulse rounded bg-raised" />
        <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-raised" />
      </div>
    );
  }

  const created = clipboard.created_at
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(
        new Date(clipboard.created_at)
      )
    : "—";

  const rows = [
    { label: "ID", value: `#${clipboard.id}`, mono: true },
    { label: "Items", value: String(count), mono: true },
    { label: "Created", value: created },
  ];

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
      <div className="flex items-center gap-2 border-b border-line px-5 py-4">
        <span className="blip-dot before:hidden after:hidden h-2 w-2" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">About</h3>
      </div>
      <dl className="flex flex-col px-5 py-2">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between py-2.5 text-sm ${
              i !== rows.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <dt className="text-muted">{row.label}</dt>
            <dd
              className={`max-w-[60%] truncate text-right text-ink ${
                row.mono ? "font-mono text-xs" : ""
              }`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
