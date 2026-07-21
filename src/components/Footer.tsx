import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Twitter, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Logo } from "./Logo";
import { ColoredText } from "./ColoredText";
import { useBusinesses, useSiteContent } from "@/lib/content";

export function Footer() {
  const { data: SITE } = useSiteContent();
  const { data: businesses } = useBusinesses();
  const footerDesc =
    SITE.footerDescription?.trim() ||
    `${SITE.tagline} Powering your journey with quality fuel and uncompromising service.`;
  const locations = (businesses ?? []).filter((b) => (b.address ?? "").trim());

  return (
    <footer className="border-t border-border bg-mesh">
      <div className="container-x grid gap-10 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo className="h-10 w-auto" />
          <ColoredText
            as="p"
            colors={SITE.textColors}
            field="footer_description"
            className="mt-4 text-sm text-muted-foreground"
          >
            {footerDesc}
          </ColoredText>
          <div className="mt-5 flex gap-2">
            {[
              { Icon: Instagram, href: SITE.socials.instagram, label: "Instagram" },
              { Icon: Facebook, href: SITE.socials.facebook, label: "Facebook" },
              { Icon: Twitter, href: SITE.socials.twitter, label: "Twitter" },
              { Icon: Linkedin, href: SITE.socials.linkedin, label: "LinkedIn" },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About Us</Link></li>
            <li><Link to="/services" className="hover:text-foreground">Services</Link></li>
            <li><Link to="/events" className="hover:text-foreground">Events</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <Phone className="h-4 w-4 mt-0.5 text-primary" />
              <ColoredText as="span" colors={SITE.textColors} field="phone">{SITE.phone}</ColoredText>
            </li>
            <li className="flex gap-2">
              <Mail className="h-4 w-4 mt-0.5 text-primary" />
              <ColoredText as="span" colors={SITE.textColors} field="email">{SITE.email}</ColoredText>
            </li>
            <li className="flex gap-2">
              <Clock className="h-4 w-4 mt-0.5 text-primary" />
              <ColoredText as="span" colors={SITE.textColors} field="hours">{SITE.hours}</ColoredText>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Locations</h4>
          <ul className="mt-4 space-y-4 text-sm text-muted-foreground">
            {locations.length > 0 ? (
              locations.map((b) => (
                <li key={b.slug} className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="block font-semibold text-foreground">{b.name}</span>
                    {b.address}
                  </span>
                </li>
              ))
            ) : (
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Locations coming soon</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <ColoredText as="p" colors={SITE.textColors} field="name">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </ColoredText>
          <p>Crafted with precision · Premium Energy Brand</p>
        </div>
      </div>
    </footer>
  );
}
