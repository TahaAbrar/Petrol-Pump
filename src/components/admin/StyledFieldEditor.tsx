import { Bold, Italic, Underline } from "lucide-react";
import { FONT_FAMILIES, FONT_SIZES, parseTextStyle, type TextStyle } from "@/lib/text-style";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  style: TextStyle;
  onStyleChange: (style: TextStyle) => void;
  placeholder?: string;
};

/** Single-line field with bold / italic / underline / font / color controls. */
export function StyledFieldEditor({
  label,
  value,
  onChange,
  style,
  onStyleChange,
  placeholder,
}: Props) {
  const s = parseTextStyle(style);

  function toggle(key: keyof Pick<TextStyle, "bold" | "italic" | "underline">) {
    onStyleChange({ ...s, [key]: !s[key] });
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-input bg-background p-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-lg border border-border px-2.5 py-1.5 text-sm outline-none focus:border-primary/60"
        />
        <StyleBtn active={s.bold} icon={Bold} title="Bold" onClick={() => toggle("bold")} />
        <StyleBtn active={s.italic} icon={Italic} title="Italic" onClick={() => toggle("italic")} />
        <StyleBtn active={s.underline} icon={Underline} title="Underline" onClick={() => toggle("underline")} />
        <select
          value={s.fontFamily ?? "inherit"}
          onChange={(e) => onStyleChange({ ...s, fontFamily: e.target.value })}
          className="h-8 rounded-lg border border-border bg-background px-1.5 text-[10px]"
          aria-label="Font family"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          value={s.fontSize ?? "1rem"}
          onChange={(e) => onStyleChange({ ...s, fontSize: e.target.value })}
          className="h-8 rounded-lg border border-border bg-background px-1.5 text-[10px]"
          aria-label="Font size"
        >
          {FONT_SIZES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <input
          type="color"
          value={s.color?.startsWith("#") ? s.color : "#111827"}
          onChange={(e) => onStyleChange({ ...s, color: e.target.value })}
          className="h-8 w-8 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
          title="Text color"
          aria-label="Text color"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Preview:{" "}
        <span style={{
          fontWeight: s.bold ? 700 : 400,
          fontStyle: s.italic ? "italic" : "normal",
          textDecoration: s.underline ? "underline" : "none",
          fontFamily: s.fontFamily && s.fontFamily !== "inherit" ? s.fontFamily : undefined,
          fontSize: s.fontSize,
          color: s.color,
        }}
        >
          {value || placeholder || "Sample text"}
        </span>
      </p>
    </div>
  );
}

function StyleBtn({
  active,
  icon: Icon,
  title,
  onClick,
}: {
  active?: boolean;
  icon: typeof Bold;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-lg border transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-accent",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
