import { motion, AnimatePresence } from "framer-motion";
import { Copy, Loader2, Pencil, Trash2, Undo2, type LucideIcon } from "lucide-react";

export type SectionAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick: (e: React.MouseEvent) => void;
  tone?: "default" | "danger" | "accent";
  loading?: boolean;
  disabled?: boolean;
};

const toneClass: Record<NonNullable<SectionAction["tone"]>, string> = {
  default: "border-border bg-background text-foreground hover:bg-accent",
  danger: "border-destructive/30 bg-background text-destructive hover:bg-destructive/10",
  accent: "border-primary/30 bg-background text-primary hover:bg-primary/10",
};

/** Animated icon toolbar that appears above a selected admin section/card. */
export function SectionActionBar({
  actions,
  align = "end",
}: {
  actions: SectionAction[];
  align?: "start" | "end" | "center";
}) {
  const alignClass =
    align === "start" ? "justify-start" : align === "center" ? "justify-center" : "justify-end";

  return (
    <AnimatePresence>
      {actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className={`absolute -top-3 left-0 right-0 z-20 flex ${alignClass} px-2`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background/95 p-1 shadow-elegant backdrop-blur">
            {actions.map((a, i) => (
              <motion.button
                key={a.key}
                type="button"
                title={a.label}
                aria-label={a.label}
                disabled={a.disabled || a.loading}
                initial={{ opacity: 0, scale: 0.5, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.04 * i, type: "spring", stiffness: 500, damping: 24 }}
                onClick={a.onClick}
                className={`grid h-8 w-8 place-items-center rounded-full border transition-colors disabled:pointer-events-none disabled:opacity-60 ${toneClass[a.tone ?? "default"]}`}
              >
                {a.loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <a.icon className="h-3.5 w-3.5" />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function undoExpiresInMs(expiresAt?: string | null): number {
  if (!expiresAt) return 0;
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

export function findUndo(
  undos: { scope: string; token: string; expires_at: string }[] | undefined,
  scope: string,
) {
  if (!undos?.length) return null;
  const now = Date.now();
  return (
    undos.find((u) => u.scope === scope && new Date(u.expires_at).getTime() > now) ?? null
  );
}

export const ICONS = { Pencil, Copy, Trash2, Undo2 };
