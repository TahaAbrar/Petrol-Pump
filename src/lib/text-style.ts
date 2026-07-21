export type TextStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontFamily?: string;
  fontSize?: string;
  color?: string;
};

export const FONT_FAMILIES = [
  { value: "inherit", label: "Default" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Times New Roman', serif", label: "Times" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Helvetica, sans-serif", label: "Helvetica" },
  { value: "'Courier New', monospace", label: "Courier" },
] as const;

export const FONT_SIZES = [
  { value: "0.875rem", label: "Small" },
  { value: "1rem", label: "Normal" },
  { value: "1.125rem", label: "Medium" },
  { value: "1.25rem", label: "Large" },
  { value: "1.5rem", label: "XL" },
] as const;

export function textStyleToCss(style?: TextStyle): React.CSSProperties {
  if (!style) return {};
  return {
    fontWeight: style.bold ? 700 : undefined,
    fontStyle: style.italic ? "italic" : undefined,
    textDecoration: style.underline ? "underline" : undefined,
    fontFamily: style.fontFamily && style.fontFamily !== "inherit" ? style.fontFamily : undefined,
    fontSize: style.fontSize,
    color: style.color,
  };
}

export function parseTextStyle(raw: unknown): TextStyle {
  if (!raw || typeof raw !== "object") return {};
  const s = raw as Record<string, unknown>;
  return {
    bold: Boolean(s.bold),
    italic: Boolean(s.italic),
    underline: Boolean(s.underline),
    fontFamily: typeof s.fontFamily === "string" ? s.fontFamily : undefined,
    fontSize: typeof s.fontSize === "string" ? s.fontSize : undefined,
    color: typeof s.color === "string" ? s.color : undefined,
  };
}
