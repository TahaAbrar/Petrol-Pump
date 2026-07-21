import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BannerSlider } from "@/components/BannerSlider";
import { OurBusinessesSection } from "@/components/OurBusinessesSection";
import { Reveal } from "@/components/Reveal";
import { RichHtml } from "@/components/RichHtml";
import { useBusinessHub } from "@/lib/content";
import { mediaUrl } from "@/lib/api";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/businesses/")({
  head: () => ({
    meta: [
      { title: "Our Businesses — Sukka PR" },
      { name: "description", content: "Explore the Sukka Group portfolio — fabrics, trading, cargo and petroleum services." },
    ],
    links: [{ rel: "canonical", href: "/businesses" }],
  }),
  component: BusinessesOverviewPage,
});

function BusinessesOverviewPage() {
  const { data: hub } = useBusinessHub();
  const bannerImages = (hub?.banner_images ?? [])
    .filter((b) => b.image)
    .map((b) => mediaUrl(b.image!));

  const bannerFields = (hub?.banner_fields as Record<string, boolean> | undefined) ?? {};
  const showSubtitle = bannerFields.subtitle !== false;
  const showTitle = bannerFields.title !== false;
  const showBody = bannerFields.body !== false;
  const showOverview = bannerFields.overview !== false;

  return (
    <div>
      <section className="relative h-[92svh] min-h-[560px] overflow-hidden">
        {bannerImages.length > 0 ? (
          <BannerSlider images={bannerImages} alt="Our Businesses" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-muted" />
        )}
        <div className="container-x relative z-10 flex h-full items-end pb-16 pt-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            {showSubtitle && (
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {hub?.banner_subtitle || "Our Businesses"}
              </span>
            )}
            {showTitle && (
              <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
                {hub?.banner_title || "Building trust across every venture."}
              </h1>
            )}
            {showBody && hub?.banner_body && (
              <p className="mt-4 max-w-2xl text-muted-foreground">{hub.banner_body}</p>
            )}
          </motion.div>
        </div>
      </section>

      {showOverview && (
        <section className="py-20 md:py-28">
          <div className="container-x grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {hub?.overview_title || "Overview"}
              </span>
              {hub?.overview_subtitle && (
                <p className="mt-2 text-sm text-muted-foreground">{hub.overview_subtitle}</p>
              )}
              <RichHtml html={hub?.overview_html} className="mt-6 text-base leading-relaxed" />
            </Reveal>
            <Reveal delay={0.08}>
              {hub?.overview_image ? (
                <div className="overflow-hidden rounded-3xl border border-border shadow-elegant">
                  <img
                    src={mediaUrl(hub.overview_image)}
                    alt="Group overview"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
              ) : (
                <div className="grid aspect-[4/3] place-items-center rounded-3xl border border-dashed border-border bg-muted/30">
                  <Building2 className="h-12 w-12 text-muted-foreground/40" />
                </div>
              )}
            </Reveal>
          </div>
        </section>
      )}

      <OurBusinessesSection tone="mesh" />
    </div>
  );
}
