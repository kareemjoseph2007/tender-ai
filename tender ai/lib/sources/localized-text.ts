export function pickLocalizedText(
  value: unknown,
  preferredLang = "eng"
): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(String).join(", ") || null;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = record[preferredLang];
    if (preferred != null) return pickLocalizedText(preferred, preferredLang);
    for (const entry of Object.values(record)) {
      const text = pickLocalizedText(entry, preferredLang);
      if (text) return text;
    }
  }
  return null;
}
