export type OurStoryContent = {
  eyebrow: string;
  title: string;
  body: string;
  mission: string;
  vision: string;
  services: string;
};

export type LeadershipStat = { v: string; l: string };

export type LeadershipPerson = {
  name: string;
  role: string;
  quote: string;
};

export type LeadershipContent = {
  eyebrow: string;
  title: string;
  /** Fixed order: CEO 1, CEO 2, Manager */
  people: LeadershipPerson[];
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

export const DEFAULT_LEADERSHIP_PEOPLE: LeadershipPerson[] = [
  {
    name: "Mr. Anil Verma",
    role: "CEO",
    quote:
      "We're not just selling fuel — we're selling time, trust and the confidence that your vehicle is in safe hands.",
  },
  {
    name: "Ms. Priya Sharma",
    role: "CEO",
    quote:
      "Growth means nothing without integrity. We build every partnership and every litre of fuel on that foundation.",
  },
  {
    name: "Mr. Rohit Khan",
    role: "Manager",
    quote:
      "My job is to make every shift seamless — safe pumps, clean forecourt, and a team that greets every customer like family.",
  },
];

export const DEFAULT_LEADERSHIP: LeadershipContent = {
  eyebrow: "Leadership",
  title: "The people steering our station.",
  people: DEFAULT_LEADERSHIP_PEOPLE.map((p) => ({ ...p })),
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

function parsePerson(raw: unknown, fallback: LeadershipPerson): LeadershipPerson {
  if (!raw || typeof raw !== "object") return { ...fallback };
  const src = raw as Record<string, unknown>;
  return {
    name: pickString(src, "name", fallback.name),
    role: pickString(src, "role", fallback.role),
    quote: pickString(src, "quote", fallback.quote),
  };
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

  const peopleRaw = src.people;
  let people: LeadershipPerson[];
  if (Array.isArray(peopleRaw) && peopleRaw.length > 0) {
    people = DEFAULT_LEADERSHIP_PEOPLE.map((fallback, i) => parsePerson(peopleRaw[i], fallback));
  } else {
    // Legacy single-founder shape → map into CEO 1, keep defaults for CEO 2 + Manager
    const legacyName = pickString(src, "founderName", DEFAULT_LEADERSHIP_PEOPLE[0].name);
    const legacyRole = pickString(src, "founderRole", DEFAULT_LEADERSHIP_PEOPLE[0].role);
    const legacyQuote = pickString(src, "quote", DEFAULT_LEADERSHIP_PEOPLE[0].quote);
    people = [
      { name: legacyName, role: legacyRole, quote: legacyQuote },
      { ...DEFAULT_LEADERSHIP_PEOPLE[1] },
      { ...DEFAULT_LEADERSHIP_PEOPLE[2] },
    ];
  }

  return {
    eyebrow: pickString(src, "eyebrow", DEFAULT_LEADERSHIP.eyebrow),
    title: pickString(src, "title", DEFAULT_LEADERSHIP.title),
    people,
    stats,
  };
}
