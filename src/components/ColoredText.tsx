import type { CSSProperties, ElementType, ReactNode } from "react";
import { getTextColor, type TextColors } from "@/lib/text-colors";

export function ColoredText<T extends ElementType = "span">({
  as,
  colors,
  field,
  className,
  style,
  children,
}: {
  as?: T;
  colors?: TextColors;
  field: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const Tag = (as ?? "span") as ElementType;
  const color = getTextColor(colors, field);
  return (
    <Tag className={className} style={{ ...(color ? { color } : {}), ...style }}>
      {children}
    </Tag>
  );
}
