import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Building2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { mediaUrl } from "@/lib/api";
import { useBusinessHub, useBusinesses } from "@/lib/content";

/** Same card grid as /businesses overview — used on home and overview page. */
export function OurBusinessesSection({ tone = "mesh" }: { tone?: "mesh" | "plain" }) {
  const { data: hub } = useBusinessHub();
  const { data: businesses } = useBusinesses();
  const bannerFields = (hub?.banner_fields as Record<string, boolean> | undefined) ?? {};
  if (bannerFields.businesses === false) return null;

  return (
    <section className={`py-20 md:py-28 ${tone === "mesh" ? "bg-mesh" : ""}`}>
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {hub?.businesses_title || "Our Businesses"}
          </span>
          {hub?.businesses_subtitle && (
            <p className="mt-3 text-muted-foreground">{hub.businesses_subtitle}</p>
          )}
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {(businesses ?? []).map((b, i) => (
            <BusinessCard key={b.slug} business={b} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BusinessCard({
  business,
  index,
}: {
  business: { slug: string; name: string; short_description: string; card_image: string | null };
  index: number;
}) {
  const img = business.card_image ? mediaUrl(business.card_image) : null;

  return (
    <Reveal delay={index * 0.08}>
      <motion.article
        layout
        className="group relative overflow-hidden rounded-3xl border border-border bg-background shadow-soft transition-shadow hover:shadow-elegant"
      >
        <div className="relative h-52 overflow-hidden bg-muted">
          {img ? (
            <img
              src={img}
              alt={business.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center">
              <Building2 className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
          <h3 className="absolute bottom-4 left-5 text-xl font-bold">{business.name}</h3>
        </div>
        <div className="p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">{business.short_description}</p>
          <Link
            to="/businesses/$slug"
            params={{ slug: business.slug }}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Read more
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.article>
    </Reveal>
  );
}
