import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BannerSlider, pageBannerUrls } from "@/components/BannerSlider";
import { Reveal } from "@/components/Reveal";
import { RichHtml } from "@/components/RichHtml";
import { usePage } from "@/lib/content";
import { mediaUrl } from "@/lib/api";

export const Route = createFileRoute("/about/our-story")({
  head: () => ({
    meta: [{ title: "Our Story — About Us" }],
    links: [{ rel: "canonical", href: "/about/our-story" }],
  }),
  component: OurStoryPage,
});

function OurStoryPage() {
  const { data: page } = usePage("about_story");
  const banners = pageBannerUrls(page, mediaUrl);
  const gallery = (page?.story_gallery ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter((g) => g.image);
  const mission = String(page?.extra?.mission || "");
  const vision = String(page?.extra?.vision || "");
  const bannerTitle = (page?.title || "").trim();

  // Split gallery into left / right for timeline layout
  const left = gallery.filter((_, i) => i % 2 === 0);
  const right = gallery.filter((_, i) => i % 2 === 1);

  return (
    <div>
      <section className="relative h-[70svh] min-h-[420px] overflow-hidden">
        {banners.length > 0 ? (
          <BannerSlider images={banners} alt="Our Story" showDots={banners.length > 1} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-muted" />
        )}
        <div className="container-x relative z-10 flex h-full items-end pb-14 pt-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold md:text-5xl"
          >
            {bannerTitle || "Our Story"}
          </motion.h1>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-x">
          <Reveal className="text-center">
            <h2 className="inline-block text-2xl font-semibold text-sky-600 md:text-3xl">
              Our Story
              <span className="mt-2 block h-px w-full bg-sky-500/70" />
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_minmax(0,28rem)_1fr] lg:items-start">
            <div className="hidden space-y-10 lg:block">
              {left.map((img) => (
                <figure key={img.id}>
                  <img
                    src={mediaUrl(img.image!)}
                    alt={img.caption}
                    className="w-full rounded-lg object-cover shadow-soft"
                  />
                  <figcaption className="mt-2 text-xs text-muted-foreground">{img.caption}</figcaption>
                </figure>
              ))}
            </div>

            <Reveal>
              <RichHtml
                html={page?.body}
                className="text-[15px] leading-relaxed text-foreground/85 [&_h1]:mb-2 [&_h1]:mt-8 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-sky-600 [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-sky-600 [&_p]:my-3"
              />
            </Reveal>

            <div className="hidden space-y-10 lg:block">
              {right.map((img) => (
                <figure key={img.id}>
                  <img
                    src={mediaUrl(img.image!)}
                    alt={img.caption}
                    className="w-full rounded-lg object-cover shadow-soft"
                  />
                  <figcaption className="mt-2 text-xs text-muted-foreground">{img.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>

          {/* Mobile gallery */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:hidden">
            {gallery.map((img) => (
              <figure key={img.id}>
                <img
                  src={mediaUrl(img.image!)}
                  alt={img.caption}
                  className="w-full rounded-lg object-cover"
                />
                <figcaption className="mt-2 text-xs text-muted-foreground">{img.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {(mission || vision) && (
        <section className="bg-mesh py-16 md:py-24">
          <div className="container-x grid gap-10 md:grid-cols-2">
            {mission && (
              <Reveal>
                <h3 className="text-xl font-semibold text-sky-600">Mission</h3>
                <RichHtml html={mission} className="mt-4 text-sm leading-relaxed text-muted-foreground" />
              </Reveal>
            )}
            {vision && (
              <Reveal delay={0.06}>
                <h3 className="text-xl font-semibold text-sky-600">Vision</h3>
                <RichHtml html={vision} className="mt-4 text-sm leading-relaxed text-muted-foreground" />
              </Reveal>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
