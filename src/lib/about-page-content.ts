export type OurStoryContent = {
  eyebrow: string;
  title: string;
  body: string;
  mission: string;
  vision: string;
  services: string;
};

export type LeadershipStat = { v: string; l: string };

export type LeadershipContent = {
  eyebrow: string;
  title: string;
  quote: string;
  founderName: string;
  founderRole: string;
  stats: LeadershipStat[];
};

export const DEFAULT_OUR_STORY: OurStoryContent = {
  eyebrow: "Our story",
  title: "Three decades. One promise.",
  body:
    "Founded in 1994 as a single-pump roadside station, we grew by stubbornly insisting on two things — pure fuel and warm service. Today we run one of the most-recognised premium forecourts in the region, serving thousands of vehicles every week.",
  mission: "Make every refuel feel premium, fast and worry-free.",
  vision: "Set the new global standard for the modern fuel station.",
  services: "Petrol, Diesel, Premium fuels, EV charging, Air & lounge.",
};

export const DEFAULT_LEADERSHIP: LeadershipContent = {
  eyebrow: "Leadership",
  title: "A message from our founder.",
  quote:
    "We're not just selling fuel — we're selling time, trust and the confidence that your vehicle is in safe hands. Every team member, every pump, every detail at this station exists to honour that promise.",
  founderName: "Mr. Anil Verma",
  founderRole: "Founder & Managing Director",
  stats: [
    { v: "30+", l: "Years experience" },
    { v: "5", l: "Awards won" },
    { v: "120", l: "Team members" },
  ],
};

function pickString(obj: unknown, key: string, fallback: string): string {
  if (obj && typeof obj === "object" && key in obj) {
    const v = (obj as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  return fallback;
}

export function parseOurStory(extra?: Record<string, unknown>): OurStoryContent {
  const raw = extra?.ourStory;
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    eyebrow: pickString(src, "eyebrow", DEFAULT_OUR_STORY.eyebrow),
    title: pickString(src, "title", DEFAULT_OUR_STORY.title),
    body: pickString(src, "body", DEFAULT_OUR_STORY.body),
    mission: pickString(src, "mission", DEFAULT_OUR_STORY.mission),
    vision: pickString(src, "vision", DEFAULT_OUR_STORY.vision),
    services: pickString(src, "services", DEFAULT_OUR_STORY.services),
  };
}

export function parseLeadership(extra?: Record<string, unknown>): LeadershipContent {
  const raw = extra?.leadership;
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const statsRaw = src.stats;
  const stats =
    Array.isArray(statsRaw) && statsRaw.length > 0
      ? DEFAULT_LEADERSHIP.stats.map((fallback, i) => {
          const item = statsRaw[i];
          if (item && typeof item === "object" && "v" in item && "l" in item) {
            return { v: String((item as LeadershipStat).v), l: String((item as LeadershipStat).l) };
          }
          return { ...fallback };
        })
      : DEFAULT_LEADERSHIP.stats.map((s) => ({ ...s }));

  return {
    eyebrow: pickString(src, "eyebrow", DEFAULT_LEADERSHIP.eyebrow),
    title: pickString(src, "title", DEFAULT_LEADERSHIP.title),
    quote: pickString(src, "quote", DEFAULT_LEADERSHIP.quote),
    founderName: pickString(src, "founderName", DEFAULT_LEADERSHIP.founderName),
    founderRole: pickString(src, "founderRole", DEFAULT_LEADERSHIP.founderRole),
    stats,
  };
}
