"use client";

import { useState, useEffect } from "react";
import { ClipboardPlus } from "lucide-react";

export default function CreateNewClipboardModal({ isOpen, onClose, onConfirm, clipboardCreationFailure }) {
  const [clipboardData, setClipboardData] = useState({ name: "" });

  useEffect(() => {
    if (!isOpen) setClipboardData({ name: "" });
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = () => {
    if (clipboardData.name.trim()) onConfirm(clipboardData);
  };

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
          <ClipboardPlus className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-semibold tracking-tight">New clipboard</h2>
        <p className="mt-1.5 text-sm text-muted">
          Give it a short, memorable name. You can switch between clipboards from the sidebar.
        </p>

        <label className="mt-5 flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Clipboard name
          </span>
          <input
            type="text"
            autoFocus
            placeholder="e.g. work, phone, scratch"
            className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft"
            value={clipboardData.name}
            onChange={(e) => setClipboardData({ ...clipboardData, name: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </label>

        {clipboardCreationFailure && (
          <p className="mt-3 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent">
            A clipboard with that name already exists.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-raised"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!clipboardData.name.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
