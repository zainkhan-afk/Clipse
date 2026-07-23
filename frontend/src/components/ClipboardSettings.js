"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, Eraser, Save } from "lucide-react";

import ConfirmDialog from "./ConfirmDialog";
import { useClipboards } from "@/context/ClipboardContext";
import { updateClipboard, deleteClipboard, clearClipboard } from "@/api/clipboard";
import { TTL_PRESETS, TTL_UNITS, isPreset, splitCustom, formatTTL } from "@/lib/ttl";

const COLORS = ["#e8472a", "#e0982e", "#3aa675", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function ClipboardSettings({ clipboard, count = 0, onRefresh }) {
  const router = useRouter();
  const { ClipboardsData, refresh: refreshClipboards } = useClipboards();

  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [ttlMode, setTtlMode] = useState("preset"); // "preset" | "custom"
  const [presetSeconds, setPresetSeconds] = useState(0);
  const [customValue, setCustomValue] = useState(1);
  const [customUnit, setCustomUnit] = useState(86400);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const [confirm, setConfirm] = useState(null); // "delete" | "clear" | null
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [ttlConfirmOpen, setTtlConfirmOpen] = useState(false);

  // Sync form whenever a different clipboard loads (keyed on id so user edits
  // aren't clobbered by background refreshes of the same clipboard).
  useEffect(() => {
    if (!clipboard) return;
    setName(clipboard.name ?? "");
    setColor(clipboard.color ?? "");
    const s = clipboard.persistance ?? 0;
    if (isPreset(s)) {
      setTtlMode("preset");
      setPresetSeconds(s);
    } else {
      setTtlMode("custom");
      const c = splitCustom(s);
      setCustomValue(c.value);
      setCustomUnit(c.unit);
    }
    setSaveError("");
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipboard?.id]);

  const currentSeconds =
    ttlMode === "preset" ? presetSeconds : Math.max(0, Number(customValue) || 0) * customUnit;

  const nameTrimmed = name.trim();

  const nameTaken = useMemo(() => {
    if (!nameTrimmed) return false;
    const others = (ClipboardsData ?? []).filter((c) => c.id !== clipboard?.id);
    return others.some((c) => c.name.trim().toLowerCase() === nameTrimmed.toLowerCase());
  }, [ClipboardsData, clipboard?.id, nameTrimmed]);

  const nameError = !nameTrimmed ? "Name is required" : nameTaken ? "That name is already taken" : "";

  const changed =
    !!clipboard &&
    (nameTrimmed !== (clipboard.name ?? "") ||
      (color || "") !== (clipboard.color ?? "") ||
      currentSeconds !== (clipboard.persistance ?? 0));

  const canSave = changed && !nameError && !saving;

  // A TTL change is "destructive" when the new retention is shorter than the saved
  // one (or a limit is set on a previously-forever clipboard): it retroactively
  // removes messages older than the new limit. 0 = forever.
  const savedSeconds = clipboard?.persistance ?? 0;
  const ttlMoreRestrictive =
    currentSeconds > 0 && (savedSeconds === 0 || currentSeconds < savedSeconds);
  const needsTtlWarning = ttlMoreRestrictive && count > 0;

  function onSaveClick() {
    if (!canSave) return;
    if (needsTtlWarning) {
      setTtlConfirmOpen(true);
    } else {
      handleSave();
    }
  }

  async function confirmTtlAndSave() {
    setTtlConfirmOpen(false);
    await handleSave();
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      await updateClipboard(clipboard.id, {
        name: nameTrimmed,
        persistance: currentSeconds === 0 ? null : currentSeconds,
        color: color || null,
      });
      await refreshClipboards();
      onRefresh?.();
      setSaved(true);
    } catch (err) {
      setSaveError(err?.message || "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setActionBusy(true);
    setActionError("");
    try {
      await deleteClipboard(clipboard.id);
      await refreshClipboards();
      router.push("/dashboard");
    } catch (err) {
      setActionError(err?.message || "Couldn't delete clipboard.");
      setActionBusy(false);
      setConfirm(null);
    }
  }

  async function handleClear() {
    setActionBusy(true);
    setActionError("");
    try {
      await clearClipboard(clipboard.id);
      onRefresh?.();
      setConfirm(null);
    } catch (err) {
      setActionError(err?.message || "Couldn't clear items.");
    } finally {
      setActionBusy(false);
    }
  }

  if (!clipboard) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
        <div className="h-4 w-24 animate-pulse rounded bg-raised" />
        <div className="mt-4 h-9 w-full animate-pulse rounded-lg bg-raised" />
        <div className="mt-3 h-9 w-full animate-pulse rounded-lg bg-raised" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
      <div className="flex items-center gap-2 border-b border-line px-5 py-4">
        <span className="ping-dot before:hidden after:hidden h-2 w-2" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Settings</h3>
      </div>

      {/* General */}
      <section className="border-b border-line p-5">
        <SectionLabel>General</SectionLabel>

        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Clipboard name"
            className={`w-full rounded-xl border bg-bg px-3 py-2 text-sm text-ink outline-none transition-colors focus:ring-2 focus:ring-accent-soft ${
              nameError && nameTrimmed !== (clipboard.name ?? "")
                ? "border-accent focus:border-accent"
                : "border-line focus:border-accent"
            }`}
          />
          {nameError && nameTrimmed !== (clipboard.name ?? "") && (
            <span className="mt-1 block text-xs text-accent">{nameError}</span>
          )}
        </label>

        <div className="mt-4">
          <span className="mb-2 block text-xs font-medium text-muted">Color</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setColor("")}
              aria-label="No color"
              className={`grid h-7 w-7 place-items-center rounded-full border text-faint transition-transform hover:scale-110 ${
                color === "" ? "border-ink" : "border-line"
              }`}
            >
              <span className="text-xs">∅</span>
            </button>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                style={{ background: c }}
                className={`grid h-7 w-7 place-items-center rounded-full transition-transform hover:scale-110 ${
                  color === c ? "ring-2 ring-offset-2 ring-offset-surface ring-ink" : ""
                }`}
              >
                {color === c && <Check className="h-3.5 w-3.5 text-white" />}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Persistence */}
      <section className="border-b border-line p-5">
        <SectionLabel>Persistence</SectionLabel>
        <p className="mt-1 text-xs text-faint">Automatically remove items after…</p>

        <select
          value={ttlMode === "custom" ? "custom" : String(presetSeconds)}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "custom") {
              setTtlMode("custom");
            } else {
              setTtlMode("preset");
              setPresetSeconds(Number(v));
            }
          }}
          className="mt-3 w-full appearance-none rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft"
        >
          {TTL_PRESETS.map((p) => (
            <option key={p.seconds} value={String(p.seconds)}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom…</option>
        </select>

        {ttlMode === "custom" && (
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              min={1}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="w-20 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft"
            />
            <select
              value={customUnit}
              onChange={(e) => setCustomUnit(Number(e.target.value))}
              className="flex-1 appearance-none rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft"
            >
              {TTL_UNITS.map((u) => (
                <option key={u.seconds} value={u.seconds}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={onSaveClick}
          disabled={!canSave}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saved && !changed ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : saved && !changed ? "Saved" : "Save changes"}
        </button>
        {saveError && (
          <p className="mt-2 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-accent">
            {saveError}
          </p>
        )}
      </section>

      {/* Danger zone */}
      <section className="p-5">
        <SectionLabel danger>Danger zone</SectionLabel>
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setActionError("");
              setConfirm("clear");
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-raised"
          >
            <Eraser className="h-4 w-4 text-muted" />
            Clear all items
          </button>
          <button
            type="button"
            onClick={() => {
              setActionError("");
              setConfirm("delete");
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent-soft px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
            Delete clipboard
          </button>
        </div>
        {actionError && (
          <p className="mt-2 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-accent">
            {actionError}
          </p>
        )}
      </section>

      <ConfirmDialog
        isOpen={confirm === "clear"}
        onClose={() => setConfirm(null)}
        onConfirm={handleClear}
        busy={actionBusy}
        title="Clear all items?"
        message={`This removes all ${count} item${count === 1 ? "" : "s"} from "${clipboard.name}". The clipboard itself is kept.`}
        confirmLabel="Clear items"
      />
      <ConfirmDialog
        isOpen={confirm === "delete"}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        busy={actionBusy}
        title="Delete this clipboard?"
        message={`"${clipboard.name}" and everything in it will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete clipboard"
      />
      <ConfirmDialog
        isOpen={ttlConfirmOpen}
        onClose={() => setTtlConfirmOpen(false)}
        onConfirm={confirmTtlAndSave}
        busy={saving}
        title="Shorten retention?"
        message={`Messages in "${clipboard.name}" older than ${formatTTL(currentSeconds)} will be removed and can't be recovered. New items expire ${formatTTL(currentSeconds)} after they're added.`}
        confirmLabel="Save changes"
      />
    </div>
  );
}

function SectionLabel({ children, danger }) {
  return (
    <span
      className={`text-[11px] font-semibold uppercase tracking-wider ${
        danger ? "text-accent" : "text-faint"
      }`}
    >
      {children}
    </span>
  );
}
