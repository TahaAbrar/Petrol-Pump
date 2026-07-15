import type { LucideIcon } from "lucide-react";
import {
  Clock,
  Droplets,
  Fuel,
  Gauge,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
  Zap,
} from "lucide-react";

export const FEATURE_ICON_OPTIONS = [
  { key: "Fuel", label: "Fuel pump", Icon: Fuel },
  { key: "Gauge", label: "Gauge / speed", Icon: Gauge },
  { key: "Sparkles", label: "Sparkles", Icon: Sparkles },
  { key: "ShieldCheck", label: "Shield", Icon: ShieldCheck },
  { key: "Clock", label: "Clock", Icon: Clock },
  { key: "Wrench", label: "Wrench", Icon: Wrench },
  { key: "Zap", label: "Zap / EV", Icon: Zap },
  { key: "Heart", label: "Heart", Icon: Heart },
  { key: "Star", label: "Star", Icon: Star },
  { key: "MapPin", label: "Map pin", Icon: MapPin },
  { key: "Droplets", label: "Droplets", Icon: Droplets },
] as const;

export type FeatureIconKey = (typeof FEATURE_ICON_OPTIONS)[number]["key"];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  FEATURE_ICON_OPTIONS.map((o) => [o.key, o.Icon]),
);

export function resolveFeatureIcon(key?: string): LucideIcon {
  return (key && ICON_MAP[key]) || Fuel;
}

export type FeatureCard = {
  icon: FeatureIconKey;
  title: string;
  desc: string;
};

export type FeaturesSectionContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  cards: FeatureCard[];
};

export const DEFAULT_FEATURE_CARDS: FeatureCard[] = [
  {
    icon: "Fuel",
    title: "Premium Quality Fuel",
    desc: "Refined to the highest purity standards for maximum mileage and engine health.",
  },
  {
    icon: "Gauge",
    title: "Fast Service",
    desc: "High-flow dispensers and trained crew get you back on the road in minutes.",
  },
  {
    icon: "Sparkles",
    title: "Spotless Facilities",
    desc: "Hospital-grade cleanliness across the forecourt, washrooms and lounge.",
  },
  {
    icon: "ShieldCheck",
    title: "Customer First",
    desc: "Every visit is backed by our satisfaction guarantee and care team.",
  },
  {
    icon: "Clock",
    title: "Open 24 / 7",
    desc: "Day or night, holiday or rush hour — we're always ready for you.",
  },
  {
    icon: "Wrench",
    title: "Modern Equipment",
    desc: "State-of-the-art pumps, EV chargers and calibrated meters you can trust.",
  },
];

export const DEFAULT_FEATURES: FeaturesSectionContent = {
  eyebrow: "Why customers stay",
  title: "Everything you'd expect, refined.",
  subtitle: "Six promises we keep on every visit, every single time.",
  cards: DEFAULT_FEATURE_CARDS.map((c) => ({ ...c })),
};

function pickString(obj: unknown, key: string, fallback: string): string {
  if (obj && typeof obj === "object" && key in obj) {
    const v = (obj as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  return fallback;
}

function parseIcon(raw: unknown, fallback: FeatureIconKey): FeatureIconKey {
  if (typeof raw === "string" && raw in ICON_MAP) return raw as FeatureIconKey;
  return fallback;
}

function parseCard(raw: unknown, fallback: FeatureCard): FeatureCard {
  if (!raw || typeof raw !== "object") return { ...fallback };
  const src = raw as Record<string, unknown>;
  return {
    icon: parseIcon(src.icon, fallback.icon),
    title: pickString(src, "title", fallback.title),
    desc: pickString(src, "desc", fallback.desc),
  };
}

/** Read home `extra.features` — falls back to hardcoded defaults. */
export function parseFeatures(extra?: Record<string, unknown>): FeaturesSectionContent {
  const raw = extra?.features;
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const cardsRaw = src.cards;

  const cards =
    Array.isArray(cardsRaw) && cardsRaw.length > 0
      ? cardsRaw.map((item, i) =>
          parseCard(item, DEFAULT_FEATURE_CARDS[i] ?? { icon: "Fuel", title: "", desc: "" }),
        )
      : DEFAULT_FEATURE_CARDS.map((c) => ({ ...c }));

  return {
    eyebrow: pickString(src, "eyebrow", DEFAULT_FEATURES.eyebrow),
    title: pickString(src, "title", DEFAULT_FEATURES.title),
    subtitle: pickString(src, "subtitle", DEFAULT_FEATURES.subtitle),
    cards: cards.length > 0 ? cards : DEFAULT_FEATURE_CARDS.map((c) => ({ ...c })),
  };
}
