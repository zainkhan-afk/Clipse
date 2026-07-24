// Parse a timestamp coming from the API. The backend sends UTC; if the string has
// no timezone designator, treat it as UTC (otherwise the browser reads it as local
// time and the hour comes out wrong). Already-offset/`Z` strings pass through.
export function parseServerDate(value) {
  if (value == null) return null;
  if (typeof value === "string" && !/([zZ]|[+-]\d\d:?\d\d)$/.test(value)) {
    return new Date(value + "Z");
  }
  return new Date(value);
}
