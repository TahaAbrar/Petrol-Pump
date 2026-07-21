import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Building2, Fuel, Package, Ship, Store, Truck,
} from "lucide-react";
import { BannerSlider, pageBannerUrls } from "@/components/BannerSlider";
import { Reveal } from "@/components/Reveal";
import { RichHtml } from "@/components/RichHtml";
import { useBusinesses, usePage } from "@/lib/content";
import { mediaUrl } from "@/lib/api";

export const Route = createFileRoute("/about/")({
  head: () => ({
    meta: [
      { title: "About Us — Overview" },
      { name: "description", content: "Learn about Sukka Group — overview, businesses and values." },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutOverviewPage,
});

const ICON_MAP: Record<string, typeof Building2> = {
  Building2,
  Fuel,
  Package,
  Ship,
  Store,
  Truck,
};

const COLOR_CYCLE = ["#0ea5e9", "#14b8a6", "#6366f1", "#c8102e", "#f59e0b", "#10b981"];

function AboutOverviewPage() {
  const { data: page } = usePage("about");
  const { data: businesses } = useBusinesses();
  const banners = pageBannerUrls(page, mediaUrl);
  const aboutHtml = page?.body || "";
  const bannerTitle = (page?.title || "").trim();
  const bannerBody = (page?.subtitle || "").trim();
  const list = businesses ?? [];

  return (
    <div>
      <section className="relative h-[92svh] min-h-[560px] overflow-hidden">
        {banners.length > 0 ? (
          <BannerSlider images={banners} alt="About" showDots={banners.length > 1} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-muted" />
        )}
        {(bannerTitle || bannerBody) && (
          <div className="container-x relative z-10 flex h-full items-end justify-start pb-16 pt-8">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-xl text-left"
            >
              {bannerTitle && <h1 className="text-4xl font-bold md:text-5xl">{bannerTitle}</h1>}
              {bannerBody && <p className="mt-3 text-muted-foreground">{bannerBody}</p>}
            </motion.div>
          </div>
        )}
      </section>

      <section className="py-16 md:py-24">
        <div className="container-x max-w-4xl">
          <Reveal className="text-center">
            <h2 className="inline-block text-2xl font-semibold text-sky-600 md:text-3xl">
              About Us
              <span className="mt-2 block h-px w-full bg-sky-500/70" />
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <RichHtml
              html={aboutHtml}
              className="mx-auto mt-8 max-w-3xl text-center text-[15px] leading-relaxed text-foreground/80 [&_p]:my-3"
            />
          </Reveal>
        </div>
      </section>

      <section className="bg-muted/40 py-16 md:py-24">
        <div className="container-x">
          <Reveal className="text-center">
            <h2 className="text-2xl font-medium text-sky-600 md:text-3xl">Sukka Group consists of:</h2>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-5xl md:grid-cols-2 md:gap-x-16">
            {list.map((b, i) => {
              const Icon = ICON_MAP[b.icon_key || ""] || Building2;
              const color = b.accent_color || COLOR_CYCLE[i % COLOR_CYCLE.length];
              const showTopBorder = i >= 2;
              return (
                <Reveal key={b.slug} delay={(i % 4) * 0.04}>
                  <Link
                    to="/businesses/$slug"
                    params={{ slug: b.slug }}
                    className={`flex gap-4 py-5 ${showTopBorder ? "border-t border-dashed border-border" : ""}`}
                  >
                    <span
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-white shadow-soft"
                      style={{ backgroundColor: color }}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-lg font-bold" style={{ color }}>
                        {b.name}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {b.short_description}
                      </span>
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
