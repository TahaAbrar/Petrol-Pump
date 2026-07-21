import { cn } from "@/lib/utils";

/** Render admin-authored HTML (lists, bold, etc.) on public pages. */
export function RichHtml({
  html,
  className,
}: {
  html?: string | null;
  className?: string;
}) {
  if (!html?.trim()) return null;
  return (
    <div
      className={cn(
        "rich-html prose prose-sm max-w-none text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_p]:my-2",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
