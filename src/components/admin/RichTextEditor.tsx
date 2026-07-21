import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  Heading1,
  Heading2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FONT_FAMILIES, FONT_SIZES } from "@/lib/text-style";

type Props = {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  className?: string;
};

function exec(cmd: string, val?: string) {
  document.execCommand(cmd, false, val);
}

/** Fixed-height rich editor (300px) with scrollbar for long content. */
export function RichTextEditor({ label, value, onChange, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.innerHTML === value) return;
    el.innerHTML = value || "";
  }, [value]);

  function sync() {
    onChange(ref.current?.innerHTML ?? "");
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      )}
      <div className="overflow-hidden rounded-xl border border-input bg-background">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1">
          <ToolBtn icon={Bold} title="Bold" onClick={() => { exec("bold"); sync(); }} />
          <ToolBtn icon={Italic} title="Italic" onClick={() => { exec("italic"); sync(); }} />
          <ToolBtn icon={Underline} title="Underline" onClick={() => { exec("underline"); sync(); }} />
          <ToolBtn icon={Heading1} title="Heading 1" onClick={() => { exec("formatBlock", "h1"); sync(); }} />
          <ToolBtn icon={Heading2} title="Heading 2" onClick={() => { exec("formatBlock", "h2"); sync(); }} />
          <ToolBtn icon={List} title="Bullet list" onClick={() => { exec("insertUnorderedList"); sync(); }} />
          <ToolBtn icon={ListOrdered} title="Numbered list" onClick={() => { exec("insertOrderedList"); sync(); }} />
          <ToolBtn icon={AlignLeft} title="Paragraph" onClick={() => { exec("formatBlock", "p"); sync(); }} />
          <label className="ml-1 flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-1.5 text-[10px]" title="Text color">
            Color
            <input
              type="color"
              className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
              onChange={(e) => {
                exec("foreColor", e.target.value);
                sync();
              }}
            />
          </label>
          <select
            className="ml-1 h-7 rounded-lg border border-border bg-background px-1.5 text-[10px]"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) exec("fontSize", e.target.value);
              sync();
              e.target.value = "";
            }}
            aria-label="Font size"
          >
            <option value="">Size</option>
            {FONT_SIZES.map((s) => (
              <option key={s.value} value="3">{s.label}</option>
            ))}
          </select>
          <select
            className="h-7 rounded-lg border border-border bg-background px-1.5 text-[10px]"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) exec("fontName", e.target.value);
              sync();
            }}
            aria-label="Font family"
          >
            <option value="">Font</option>
            {FONT_FAMILIES.filter((f) => f.value !== "inherit").map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          onBlur={sync}
          className="h-[300px] overflow-y-auto px-3 py-2 text-sm outline-none [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold"
          data-placeholder="Write description…"
        />
      </div>
    </div>
  );
}

function ToolBtn({
  icon: Icon,
  title,
  onClick,
}: {
  icon: typeof Bold;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
