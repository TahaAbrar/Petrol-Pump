import { DEFAULT_TEXT_COLOR, normalizeHexColor } from "@/lib/text-colors";

type ColoredFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  color: string;
  onColorChange: (color: string) => void;
  multiline?: boolean;
  rows?: number;
  type?: string;
  placeholder?: string;
};

function ColorPicker({
  color,
  onColorChange,
}: {
  color: string;
  onColorChange: (color: string) => void;
}) {
  const resolved = normalizeHexColor(color);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <input
        type="color"
        value={resolved}
        onChange={(e) => onColorChange(e.target.value)}
        className="h-9 w-11 cursor-pointer rounded-lg border border-input bg-background p-0.5"
        aria-label="Pick text color"
      />
      <input
        type="text"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        onBlur={() => onColorChange(normalizeHexColor(color))}
        placeholder="#000000"
        spellCheck={false}
        className="w-28 rounded-lg border border-input bg-background px-2 py-1.5 font-mono text-xs outline-none focus:border-primary/60"
      />
      <span className="text-xs text-muted-foreground">Text color (default black)</span>
    </div>
  );
}

export function ColoredField({
  label,
  value,
  onChange,
  color,
  onColorChange,
  multiline = false,
  rows = 3,
  type = "text",
  placeholder,
}: ColoredFieldProps) {
  const resolved = normalizeHexColor(color || DEFAULT_TEXT_COLOR);
  const fieldClass =
    "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60";

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          style={{ color: resolved }}
          className={fieldClass}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ color: resolved }}
          className={fieldClass}
        />
      )}
      <ColorPicker color={color || DEFAULT_TEXT_COLOR} onColorChange={onColorChange} />
    </div>
  );
}
