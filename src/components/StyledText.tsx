import { parseTextStyle, textStyleToCss } from "@/lib/text-style";
import { cn } from "@/lib/utils";

export function StyledText({
  text,
  style,
  className,
  as: Tag = "span",
}: {
  text: string;
  style?: Record<string, unknown> | null;
  className?: string;
  as?: "span" | "div" | "p";
}) {
  return (
    <Tag className={className} style={textStyleToCss(parseTextStyle(style))}>
      {text}
    </Tag>
  );
}
