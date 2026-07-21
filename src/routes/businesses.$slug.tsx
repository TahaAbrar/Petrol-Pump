import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Building2, MapPin, Users } from "lucide-react";
import { BannerSlider } from "@/components/BannerSlider";
import { GalleryRowSlider } from "@/components/GalleryRowSlider";
import { Reveal } from "@/components/Reveal";
import { RichHtml } from "@/components/RichHtml";
import { StyledText } from "@/components/StyledText";
import { useBusiness } from "@/lib/content";
import { mediaUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/businesses/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `${params.slug.replace(/-/g, " ")} — Our Businesses` }],
  }),
  component: BusinessDetailPage,
});

const DEFAULT_WHY_US = [
  "Trusted quality and reliable service",
  "Experienced professional team",
  "Customer-first approach",
  "Strong industry presence",
];

function BusinessDetailPage() {
  const { slug } = Route.useParams();
  const { data: business } = useBusiness(slug);
  const meta = (business?.section_meta as Record<string, any> | undefined) ?? {};
  const bannerFields = (meta.banner_fields as Record<string, boolean> | undefined) ?? {};
  const showSubtitle = bannerFields.subtitle !== false;
  const showTitle = bannerFields.title !== false;
  const showBody = bannerFields.body !== false;
  const showBackground = meta.background?.visible !== false;
  const showInvestment = meta.investment?.visible !== false;
  const showOverview = meta.overview?.visible !== false;
  const showTeam = meta.team?.visible !== false;
  const showWhyUs = meta.why_us?.visible !== false;
  const showLocation = meta.location?.visible !== false;
  const backgroundTitle = meta.background?.title || "Background";
  const investmentTitle = meta.investment?.title || "Investment History";
  const overviewTitle = meta.overview?.title || "Overview";
  const teamTitle = meta.team?.title || "Team";

  const banners = (business?.banner_images ?? [])
    .filter((b) => b.image)
    .map((b) => mediaUrl(b.image!));
  const backgroundImages = (business?.gallery_images ?? [])
    .filter((g) => g.section === "background" && g.image)
    .map((g) => mediaUrl(g.image!));
  const investmentImages = (business?.gallery_images ?? [])
    .filter((g) => g.section === "investment" && g.image)
    .map((g) => mediaUrl(g.image!));
  const overviewImages = (business?.gallery_images ?? [])
    .filter((g) => g.section === "overview" && g.image)
    .map((g) => mediaUrl(g.image!));

  const whyUsList = (() => {
    const list = (business?.why_us ?? []).map((s) => String(s).trim()).filter(Boolean);
    return list.length ? list : DEFAULT_WHY_US;
  })();
  const mapsQuery = (business?.maps_query || business?.address || "").trim();
  const address = (business?.address || "").trim();

  return (
    <div>
      <section className="relative h-[92svh] min-h-[560px] overflow-hidden">
        {banners.length > 0 ? (
          <BannerSlider images={banners} alt={business?.name ?? "Business"} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-muted" />
        )}
        <div className="container-x relative z-10 flex h-full flex-col justify-end pb-16 pt-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            {showSubtitle && (
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {business?.banner_subtitle || "Our Businesses"}
              </span>
            )}
            {showTitle && (
              <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
                {(business?.banner_title || business?.name) ?? slug.replace(/-/g, " ")}
              </h1>
            )}
            {showBody && (business?.banner_body || business?.short_description) && (
              <p className="mt-4 max-w-2xl text-muted-foreground">
                {business?.banner_body || business?.short_description}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {showBackground && (
        <ContentSection title={backgroundTitle} html={business?.background_html} images={backgroundImages} />
      )}

      {showInvestment && (
        <ContentSection
          title={investmentTitle}
          html={business?.investment_history_html}
          images={investmentImages}
          tone="mesh"
        />
      )}

      {showOverview && (
        <ContentSection title={overviewTitle} html={business?.overview_html} images={overviewImages} />
      )}

      {showTeam && (
        <section className="py-20 md:py-28">
          <div className="container-x">
            <Reveal className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{teamTitle}</span>
                <h2 className="mt-1 text-3xl font-bold md:text-4xl">Meet the people behind it</h2>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {(business?.team_members ?? []).map((member, i) => (
                <Reveal key={member.id} delay={i * 0.05}>
                  <div className="group overflow-hidden rounded-3xl border border-border bg-background shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant">
                    <div className="aspect-[3/4] overflow-hidden bg-muted">
                      {member.image ? (
                        <img
                          src={mediaUrl(member.image)}
                          alt={member.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center">
                          <Building2 className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <StyledText
                        text={member.name}
                        style={member.name_style}
                        className="text-base font-semibold"
                        as="div"
                      />
                      <StyledText
                        text={member.role}
                        style={member.role_style}
                        className="mt-1 text-sm text-muted-foreground"
                        as="div"
                      />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {(showWhyUs || showLocation) && (
        <section className="bg-mesh py-20 md:py-28">
          <div className="container-x grid gap-12 lg:grid-cols-2 lg:gap-16">
            {showWhyUs && (
              <Reveal>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Why choose us</span>
                <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
                  Why customers choose{" "}
                  <span className="text-gradient-brand">{business?.name || "us"}</span>
                </h2>
                <ul className="mt-8 space-y-3">
                  {whyUsList.map((w) => (
                    <li
                      key={w}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3.5 text-sm font-medium transition-all hover:border-primary/40 hover:shadow-soft"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
                        ✓
                      </span>
                      {w}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {showLocation && (
              <Reveal delay={0.08}>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Location</span>
                <h3 className="mt-3 text-2xl font-bold md:text-3xl">Find us on the map</h3>
                {address && <p className="mt-2 text-sm text-muted-foreground">{address}</p>}
                {mapsQuery ? (
                  <>
                    <div className="relative mt-6 overflow-hidden rounded-3xl border border-border shadow-elegant">
                      <iframe
                        title={`${business?.name ?? "Business"} location`}
                        className="aspect-[4/3] w-full"
                        loading="lazy"
                        src={`https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed`}
                      />
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
                    >
                      <MapPin className="h-4 w-4" /> Get directions
                    </a>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">Location coming soon.</p>
                )}
              </Reveal>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function ContentSection({
  title,
  html,
  images,
  tone = "plain",
}: {
  title: string;
  html?: string | null;
  images: string[];
  tone?: "plain" | "mesh";
}) {
  return (
    <section className={cn("py-16 md:py-24", tone === "mesh" && "bg-mesh")}>
      <div className="container-x">
        <Reveal className="mx-auto max-w-4xl text-center">
          <h2 className="inline-block text-2xl font-semibold tracking-wide text-primary md:text-3xl">
            {title}
            <span className="mt-2 block h-px w-full bg-primary/70" />
          </h2>
          <RichHtml
            html={html}
            className="mx-auto mt-8 max-w-3xl text-center text-[15px] leading-relaxed text-foreground/80 [&_li]:text-left [&_ol]:mx-auto [&_ol]:inline-block [&_ol]:text-left [&_p]:my-3 [&_ul]:mx-auto [&_ul]:inline-block [&_ul]:text-left"
          />
        </Reveal>
        {images.length > 0 && (
          <Reveal delay={0.08} className="mt-12">
            <GalleryRowSlider images={images} alt={title} />
          </Reveal>
        )}
      </div>
    </section>
  );
}
