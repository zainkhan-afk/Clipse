// Persistence ("time to live") helpers for clipboards.
//
// Canonical unit for a clipboard's `persistance` value is SECONDS.
// `null` or `0` means "keep forever".

export const TTL_PRESETS = [
  { label: "Never (keep forever)", seconds: 0 },
  { label: "1 hour", seconds: 3600 },
  { label: "1 day", seconds: 86400 },
  { label: "7 days", seconds: 604800 },
  { label: "30 days", seconds: 2592000 },
];

// Units offered in the "custom" TTL editor, expressed as seconds-per-unit.
export const TTL_UNITS = [
  { label: "seconds", seconds: 1 },
  { label: "minutes", seconds: 60 },
  { label: "hours", seconds: 3600 },
  { label: "days", seconds: 86400 },
];

// Human-friendly label for a stored seconds value.
export function formatTTL(seconds) {
  const s = Number(seconds) || 0;
  if (s <= 0) return "Forever";

  const days = s / 86400;
  const hours = s / 3600;
  const mins = s / 60;

  if (Number.isInteger(days) && days >= 1) return `${days} day${days === 1 ? "" : "s"}`;
  if (Number.isInteger(hours) && hours >= 1) return `${hours} hour${hours === 1 ? "" : "s"}`;
  if (Number.isInteger(mins) && mins >= 1) return `${mins} min`;
  return `${s} sec`;
}

// Does this seconds value exactly match one of the presets?
export function isPreset(seconds) {
  const s = Number(seconds) || 0;
  return TTL_PRESETS.some((p) => p.seconds === s);
}

// Split a seconds value into the most natural { value, unit } pair for the
// custom editor (unit is seconds-per-unit, matching TTL_UNITS).
export function splitCustom(seconds) {
  const s = Number(seconds) || 0;
  if (s === 0) return { value: 1, unit: 86400 };
  if (s % 86400 === 0) return { value: s / 86400, unit: 86400 };
  if (s % 3600 === 0) return { value: s / 3600, unit: 3600 };
  if (s % 60 === 0) return { value: s / 60, unit: 60 };
  return { value: s, unit: 1 };
}
