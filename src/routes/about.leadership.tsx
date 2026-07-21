import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { BannerSlider, pageBannerUrls } from "@/components/BannerSlider";
import { Reveal } from "@/components/Reveal";
import { useAboutPeople, usePage } from "@/lib/content";
import { mediaUrl } from "@/lib/api";

export const Route = createFileRoute("/about/leadership")({
  head: () => ({
    meta: [{ title: "Leadership — About Us" }],
    links: [{ rel: "canonical", href: "/about/leadership" }],
  }),
  component: LeadershipPage,
});

function LeadershipPage() {
  const { data: page } = usePage("about_leadership");
  const { data: leaders } = useAboutPeople("leader");
  const { data: directors } = useAboutPeople("director");
  const banners = pageBannerUrls(page, mediaUrl);
  const bannerTitle = (page?.title || "").trim() || "Leadership";

  return (
    <div>
      <section className="relative h-[60svh] min-h-[360px] overflow-hidden">
        {banners.length > 0 ? (
          <BannerSlider images={banners} alt="Leadership" showDots={banners.length > 1} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-muted" />
        )}
        <div className="container-x relative z-10 flex h-full items-end pb-12 pt-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold md:text-5xl"
          >
            {bannerTitle}
          </motion.h1>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-x">
          <Reveal className="text-center">
            <h2 className="text-2xl font-semibold text-sky-600 md:text-3xl">CEO / Management</h2>
          </Reveal>
          <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-8">
            {(leaders ?? []).map((p, i) => (
              <LeaderCard key={p.id} person={p} delay={i * 0.05} />
            ))}
            {(leaders ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Leadership profiles coming soon.</p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-mesh py-16 md:py-24">
        <div className="container-x">
          <Reveal className="text-center">
            <h2 className="text-2xl font-semibold text-sky-600 md:text-3xl">Board of Directors</h2>
          </Reveal>
          <div className="mx-auto mt-12 max-w-4xl space-y-6">
            {(directors ?? []).map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05}>
                <article
                  className="grid gap-5 overflow-hidden rounded-2xl border-2 bg-background p-5 sm:grid-cols-[180px_1fr] sm:p-6"
                  style={{ borderColor: p.border_color || "#c8102e" }}
                >
                  <div className="aspect-[3/4] overflow-hidden rounded-xl bg-muted sm:aspect-auto sm:h-full sm:min-h-[200px]">
                    {p.image ? (
                      <img src={mediaUrl(p.image)} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <Building2 className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{p.name}</h3>
                    <p className="mt-1 text-sm font-medium text-primary">{p.role}</p>
                    {p.message && (
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {p.message}
                      </p>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
            {(directors ?? []).length === 0 && (
              <p className="text-center text-sm text-muted-foreground">Board members coming soon.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function LeaderCard({
  person,
  delay,
}: {
  person: {
    id: number;
    name: string;
    role: string;
    message: string;
    image: string | null;
  };
  delay: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={delay} className="w-full max-w-[280px] basis-[calc(50%-1rem)]">
      <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-soft">
        <div className="aspect-[3/4] bg-muted">
          {person.image ? (
            <img src={mediaUrl(person.image)} alt={person.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center">
              <Building2 className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <div className="p-4 text-center">
          <h3 className="font-semibold">{person.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{person.role}</p>
          {person.message && (
            <>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="mt-3 text-sm font-semibold text-primary"
              >
                {open ? "Read less" : "Read more"}
              </button>
              {open && (
                <p className="mt-3 text-left text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {person.message}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Reveal>
  );
}
