import orb from "@/assets/total-orb.png";
import { cn } from "@/lib/utils";

/** Brand mark: orb + "Sukka PR" wordmark (replaces baked-in TOTAL text). */
export function Logo({ className = "h-9" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Sukka PR"
      className={cn("inline-flex items-center gap-2", className)}
    >
      <img src={orb} alt="" className="h-full w-auto shrink-0" draggable={false} />
      <span className="select-none font-display text-[0.95rem] font-bold leading-none tracking-tight text-brand-red whitespace-nowrap md:text-[1.1rem]">
        Sukka PR
      </span>
    </span>
  );
}
