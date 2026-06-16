"use client";

import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  busy = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm animate-fade"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-rise rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-semibold tracking-tight">{title}</h2>
        {message && <p className="mt-1.5 text-sm text-muted">{message}</p>}

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-raised disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
