"use client";

export default function PropertiesBar({ clipboard, count = 0 }) {
  const rows = [
    { label: "Name", value: clipboard?.name ?? "—" },
    { label: "ID", value: clipboard?.id != null ? `#${clipboard.id}` : "—", mono: true },
    { label: "Items", value: String(count), mono: true },
    {
      label: "Persistence",
      value: clipboard?.persistance ? `${clipboard.persistance} days` : "Forever",
    },
  ];

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
      <div className="flex items-center gap-2">
        <span className="blip-dot before:hidden after:hidden h-2 w-2" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Properties</h3>
      </div>

      <dl className="mt-4 flex flex-col">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between py-2.5 text-sm ${
              i !== rows.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <dt className="text-muted">{row.label}</dt>
            <dd className={`max-w-[60%] truncate text-right text-ink ${row.mono ? "font-mono text-xs" : ""}`}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
