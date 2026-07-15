// React Query hooks that feed the public site from the Django API, with the
// original static data from site-data.ts as a placeholder while loading.
import { useQuery, type QueryClient } from "@tanstack/react-query";
import {
  apiFetch,
  mediaUrl,
  type SiteSettings as ApiSite,
  type Employee as ApiEmployee,
  type EventItem as ApiEvent,
  type ServiceItem as ApiService,
  type FeaturedVideo as ApiFeaturedVideo,
  type Review as ApiReview,
  type PageContent,
} from "./api";
import {
  SITE as STATIC_SITE,
  employees as STATIC_EMPLOYEES,
  events as STATIC_EVENTS,
  services as STATIC_SERVICES,
  reviews as STATIC_REVIEWS,
} from "./site-data";
import { parseTextColors, type TextColors } from "./text-colors";

export type UiSite = typeof STATIC_SITE & { textColors: TextColors; logoUrl: string };
export type UiReview = (typeof STATIC_REVIEWS)[number] & { textColors: TextColors };
export type UiEmployee = typeof STATIC_EMPLOYEES[number] & { textColors: TextColors };
export type UiEvent = typeof STATIC_EVENTS[number] & { textColors: TextColors; featured: boolean };
export type UiService = typeof STATIC_SERVICES[number] & { textColors: TextColors; featured: boolean };
export type UiFeaturedVideo = { id: number; title: string; videoUrl: string; order: number };

/** Public content query keys — keep in sync with admin invalidation helpers. */
export const publicContentKeys = {
  site: ["site"] as const,
  reviews: ["reviews"] as const,
  employees: ["employees"] as const,
  events: ["events"] as const,
  services: ["services"] as const,
  featuredVideos: ["featured-videos"] as const,
  page: (key: string) => ["page", key] as const,
  event: (slug: string) => ["event", slug] as const,
  service: (slug: string) => ["service", slug] as const,
  allPages: ["page"] as const,
};

const publicQueryDefaults = {
  staleTime: 0,
  gcTime: 5 * 60_000,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const;

function mapSite(s: ApiSite): UiSite {
  return {
    name: s.name,
    tagline: s.tagline,
    phone: s.phone,
    email: s.email,
    address: s.address,
    hours: s.hours,
    mapsQuery: s.maps_query,
    socials: {
      instagram: s.instagram || "#",
      facebook: s.facebook || "#",
      twitter: s.twitter || "#",
      linkedin: s.linkedin || "#",
    },
    textColors: parseTextColors(s.text_colors),
    logoUrl: mediaUrl(s.logo) || "",
  };
}

function mapEmployee(e: ApiEmployee): UiEmployee {
  return {
    id: e.slug,
    name: e.name,
    role: e.role,
    image: mediaUrl(e.image) || "",
    experience: e.experience,
    bio: e.bio,
    responsibilities: e.responsibilities ?? [],
    email: e.email,
    textColors: parseTextColors(e.text_colors),
  };
}

function mapEvent(e: ApiEvent): UiEvent {
  const gallery = (e.images ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((img) => mediaUrl(img.image))
    .filter(Boolean);
  const cover = mediaUrl(e.image) || gallery[0] || "";
  const images = gallery.length ? gallery : cover ? [cover] : [];

  return {
    id: e.slug,
    title: e.title,
    description: e.description,
    longDescription: e.long_description,
    date: e.date,
    image: cover,
    images,
    videoUrl: mediaUrl(e.video) || "",
    featured: Boolean(e.featured),
    textColors: parseTextColors(e.text_colors),
  };
}

function mapService(s: ApiService): UiService {
  const gallery = (s.images ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((img) => mediaUrl(img.image))
    .filter(Boolean);
  const cover = mediaUrl(s.image) || gallery[0] || "";
  const images = gallery.length ? gallery : cover ? [cover] : [];

  return {
    id: s.slug,
    title: s.title,
    category: s.category || "General",
    description: s.description,
    longDescription: s.long_description,
    availability: s.availability || "Available",
    quantity: s.quantity || "",
    price: s.price || "",
    highlights: Array.isArray(s.highlights) ? s.highlights.map(String) : [],
    image: cover,
    images,
    featured: Boolean(s.featured),
    textColors: parseTextColors(s.text_colors),
  };
}

function mapReview(r: ApiReview): UiReview {
  return {
    name: r.name,
    role: r.role,
    rating: r.rating,
    text: r.text,
    textColors: parseTextColors(r.text_colors),
  };
}

/** Call after admin saves so the public site picks up fresh API data. */
export async function refreshPublicContent(
  qc: QueryClient,
  opts?: { pageKey?: string },
) {
  const tasks = [
    qc.invalidateQueries({ queryKey: publicContentKeys.site, refetchType: "all" }),
    qc.invalidateQueries({ queryKey: publicContentKeys.reviews, refetchType: "all" }),
    qc.invalidateQueries({ queryKey: publicContentKeys.employees, refetchType: "all" }),
    qc.invalidateQueries({ queryKey: publicContentKeys.events, refetchType: "all" }),
    qc.invalidateQueries({ queryKey: ["event"], refetchType: "all" }),
    qc.invalidateQueries({ queryKey: publicContentKeys.services, refetchType: "all" }),
    qc.invalidateQueries({ queryKey: ["service"], refetchType: "all" }),
    qc.invalidateQueries({ queryKey: publicContentKeys.featuredVideos, refetchType: "all" }),
  ];

  if (opts?.pageKey) {
    tasks.push(
      qc.invalidateQueries({
        queryKey: publicContentKeys.page(opts.pageKey),
        refetchType: "all",
      }),
    );
  } else {
    tasks.push(
      qc.invalidateQueries({ queryKey: publicContentKeys.allPages, refetchType: "all" }),
    );
  }

  await Promise.all(tasks);
}

export async function refreshEvent(qc: QueryClient, slug: string) {
  await qc.invalidateQueries({ queryKey: publicContentKeys.event(slug), refetchType: "all" });
}

export function useSiteContent() {
  const fallback: UiSite = { ...STATIC_SITE, textColors: {}, logoUrl: "" };
  const query = useQuery<UiSite>({
    queryKey: publicContentKeys.site,
    queryFn: async () => mapSite(await apiFetch<ApiSite>("/site/", { auth: false })),
    placeholderData: fallback,
    ...publicQueryDefaults,
  });
  return { ...query, data: query.data ?? fallback };
}

export function useReviews() {
  const query = useQuery<UiReview[]>({
    queryKey: publicContentKeys.reviews,
    queryFn: async () => {
      const data = await apiFetch<ApiReview[]>("/reviews/", { auth: false });
      return data.map(mapReview);
    },
    placeholderData: STATIC_REVIEWS.map((r) => ({ ...r, textColors: {} })),
    ...publicQueryDefaults,
  });
  return { ...query, data: query.data ?? STATIC_REVIEWS.map((r) => ({ ...r, textColors: {} })) };
}

export function useEmployees() {
  const query = useQuery<UiEmployee[]>({
    queryKey: publicContentKeys.employees,
    queryFn: async () => {
      const data = await apiFetch<ApiEmployee[]>("/employees/", { auth: false });
      return data.map(mapEmployee);
    },
    placeholderData: STATIC_EMPLOYEES.map((e) => ({ ...e, textColors: {} })),
    ...publicQueryDefaults,
  });
  return { ...query, data: query.data ?? STATIC_EMPLOYEES.map((e) => ({ ...e, textColors: {} })) };
}

export function useEvents() {
  const query = useQuery<UiEvent[]>({
    queryKey: publicContentKeys.events,
    queryFn: async () => {
      const data = await apiFetch<ApiEvent[]>("/events/", { auth: false });
      return data.map(mapEvent);
    },
    placeholderData: STATIC_EVENTS.map((e) => ({ ...e, featured: false, textColors: {} })),
    ...publicQueryDefaults,
  });
  return { ...query, data: query.data ?? STATIC_EVENTS.map((e) => ({ ...e, featured: false, textColors: {} })) };
}

export function useEvent(slug: string) {
  const fallback = STATIC_EVENTS.find((e) => e.id === slug);
  const fallbackUi: UiEvent | undefined = fallback
    ? { ...fallback, featured: false, textColors: {} }
    : undefined;

  const query = useQuery<UiEvent>({
    queryKey: publicContentKeys.event(slug),
    queryFn: async () => mapEvent(await apiFetch<ApiEvent>(`/events/${slug}/`, { auth: false })),
    placeholderData: fallbackUi,
    enabled: Boolean(slug),
    ...publicQueryDefaults,
  });

  return { ...query, data: query.data ?? fallbackUi };
}

export function useServices() {
  const query = useQuery<UiService[]>({
    queryKey: publicContentKeys.services,
    queryFn: async () => {
      const data = await apiFetch<ApiService[]>("/services/", { auth: false });
      return data.map(mapService);
    },
    placeholderData: STATIC_SERVICES.map((s) => ({ ...s, featured: false, textColors: {} })),
    ...publicQueryDefaults,
  });
  return { ...query, data: query.data ?? STATIC_SERVICES.map((s) => ({ ...s, featured: false, textColors: {} })) };
}

export function useService(slug: string) {
  const fallback = STATIC_SERVICES.find((s) => s.id === slug);
  const fallbackUi: UiService | undefined = fallback
    ? { ...fallback, featured: false, textColors: {} }
    : undefined;

  const query = useQuery<UiService>({
    queryKey: publicContentKeys.service(slug),
    queryFn: async () => mapService(await apiFetch<ApiService>(`/services/${slug}/`, { auth: false })),
    placeholderData: fallbackUi,
    enabled: Boolean(slug),
    ...publicQueryDefaults,
  });

  return { ...query, data: query.data ?? fallbackUi };
}

export function useFeaturedVideos() {
  const query = useQuery<UiFeaturedVideo[]>({
    queryKey: publicContentKeys.featuredVideos,
    queryFn: async () => {
      const data = await apiFetch<ApiFeaturedVideo[]>("/featured-videos/", { auth: false });
      return data
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((v) => ({
          id: v.id,
          title: v.title || "",
          videoUrl: mediaUrl(v.video) || "",
          order: v.order,
        }))
        .filter((v) => v.videoUrl);
    },
    placeholderData: [],
    ...publicQueryDefaults,
  });
  return { ...query, data: query.data ?? [] };
}

export function pageTextColors(page?: { extra?: Record<string, unknown> } | null): TextColors {
  return parseTextColors(page?.extra?.text_colors);
}

export function usePage(key: string) {
  return useQuery<PageContent | null>({
    queryKey: publicContentKeys.page(key),
    queryFn: async () => {
      try {
        return await apiFetch<PageContent>(`/pages/${key}/`, { auth: false });
      } catch {
        return null;
      }
    },
    placeholderData: null,
    ...publicQueryDefaults,
  });
}
