import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { RichHtml } from "@/components/RichHtml";
import { usePage } from "@/lib/content";
import { mediaUrl } from "@/lib/api";

/** Home teaser: first 6 story images + truncated description + Read more. */
export function HomeStoryTeaser() {
  const { data: page } = usePage("about_story");
  const images = (page?.story_gallery ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter((g) => g.image)
    .slice(0, 6);
  const html = page?.body || "";

  return (
    <section className="py-20 md:py-28">
      <div className="container-x">
        <Reveal className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Our Story</span>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">A journey built on trust</h2>
        </Reveal>

        {images.length > 0 && (
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img, i) => (
              <Reveal key={img.id} delay={i * 0.04}>
                <figure className="overflow-hidden rounded-2xl border border-border">
                  <img
                    src={mediaUrl(img.image!)}
                    alt={img.caption}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  {img.caption && (
                    <figcaption className="px-3 py-2 text-xs text-muted-foreground">{img.caption}</figcaption>
                  )}
                </figure>
              </Reveal>
            ))}
          </div>
        )}

        {html.trim() && (
          <Reveal delay={0.08}>
            <div className="mx-auto mt-10 max-w-3xl">
              <RichHtml
                html={html}
                className="line-clamp-6 text-center text-sm leading-relaxed text-muted-foreground [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-foreground"
              />
              <div className="mt-6 text-center">
                <Link
                  to="/about/our-story"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Read more <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
