import orb from "@/assets/total-orb.png";
import { useSiteContent } from "@/lib/content";
import { cn } from "@/lib/utils";

/** Brand mark: custom uploaded logo when set, otherwise orb + "Sukka PR". */
export function Logo({
  className = "h-9",
  /** Override (e.g. admin preview). Empty/undefined → use site logo or default. */
  src,
}: {
  className?: string;
  src?: string | null;
}) {
  const { data: SITE } = useSiteContent();
  const custom = (src !== undefined ? src : SITE.logoUrl) || "";
  const label = SITE.name || "Sukka PR";

  if (custom) {
    return (
      <img
        src={custom}
        alt={label}
        className={cn("h-full w-auto object-contain", className)}
        draggable={false}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <img src={orb} alt="" className="h-full w-auto shrink-0" draggable={false} />
      <span className="select-none font-display text-[0.95rem] font-bold leading-none tracking-tight text-brand-red whitespace-nowrap md:text-[1.1rem]">
        Sukka PR
      </span>
    </span>
  );
}
