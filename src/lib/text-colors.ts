export const DEFAULT_TEXT_COLOR = "#000000";

export type TextColors = Record<string, string>;

/** Normalize #RGB, #RRGGBB, or raw hex digits to #RRGGBB. */
export function normalizeHexColor(input: string): string {
  let v = input.trim();
  if (!v) return DEFAULT_TEXT_COLOR;
  if (!v.startsWith("#")) v = `#${v}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
    const [, r, g, b] = v;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return DEFAULT_TEXT_COLOR;
}

export function getTextColor(colors: TextColors | undefined, key: string): string | undefined {
  const raw = colors?.[key];
  return raw ? normalizeHexColor(raw) : undefined;
}

export function parseTextColors(raw: unknown): TextColors {
  if (!raw || typeof raw !== "object") return {};
  const out: TextColors = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim()) out[k] = normalizeHexColor(v);
  }
  return out;
}

export function useColorState(initial?: TextColors) {
  // Not a hook file — helper for merging defaults
  return parseTextColors(initial);
}
