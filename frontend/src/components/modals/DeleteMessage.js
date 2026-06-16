"use client";

import { AlertTriangle } from "lucide-react";

export default function DeleteMessageConfirmationModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm animate-fade"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-rise rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-semibold tracking-tight">Delete this item?</h2>
        <p className="mt-1.5 text-sm text-muted">
          This will permanently remove it from the clipboard. This action cannot be undone.
        </p>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-raised"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
