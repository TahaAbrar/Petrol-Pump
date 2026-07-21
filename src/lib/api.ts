// Lightweight API client for the Django backend.
// Production builds set VITE_API_URL via `.env.production` / deploy-vps.sh.
// Runtime fallback: on the live domain never call localhost (browser can't reach VPS loopback).
function resolveApiUrl(): string {
  const fromEnv =
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
    "";
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `${window.location.origin}/api`;
    }
  }
  return "http://localhost:8000/api";
}

export const API_URL = resolveApiUrl();
export const API_ORIGIN = API_URL.replace(/\/api$/, "");

const TOKEN_KEY = "tfs_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

/** Resolve a (possibly relative) media path to an absolute URL. */
export function mediaUrl(path?: string | null): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function extractMessage(data: any, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (Array.isArray(data.non_field_errors)) return data.non_field_errors.join(" ");
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const v = data[firstKey];
    const msg = Array.isArray(v) ? v.join(" ") : String(v);
    return firstKey === "non_field_errors" ? msg : `${firstKey}: ${msg}`;
  }
  return fallback;
}

type ApiOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

export async function apiFetch<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = {};

  const token = getToken();
  if (auth && token) headers["Authorization"] = `Token ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // let the browser set the multipart boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(extractMessage(data, `Request failed (${res.status})`), res.status, data);
  }
  return data as T;
}

// --- Typed shapes returned by the API --------------------------------------
export type SiteSettings = {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  maps_query: string;
  instagram: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  logo: string | null;
  footer_description?: string;
  faqs?: { question: string; answer: string }[];
  text_colors?: Record<string, string>;
};

export type BannerImageItem = {
  id: number;
  image: string | null;
  order: number;
};

export type ActiveUndo = {
  scope: string;
  token: string;
  expires_at: string;
};

export type PageContent = {
  id: number;
  key: string;
  title: string;
  subtitle: string;
  body: string;
  banner: string | null;
  banner_images?: BannerImageItem[];
  story_gallery?: { id: number; image: string | null; caption: string; order: number }[];
  active_undos?: ActiveUndo[];
  story_image: string | null;
  founder_image: string | null;
  ceo2_image: string | null;
  manager_image: string | null;
  extra: Record<string, any>;
  updated_at: string;
  undo?: ActiveUndo;
};

export type AboutPerson = {
  id: number;
  kind: "leader" | "director";
  name: string;
  role: string;
  message: string;
  image: string | null;
  border_color: string;
  order: number;
  created_at: string;
};

export type Employee = {
  id: number;
  name: string;
  slug: string;
  role: string;
  image: string | null;
  experience: string;
  bio: string;
  responsibilities: string[];
  email: string;
  order: number;
  text_colors?: Record<string, string>;
};

export type EventImageItem = {
  id: number;
  image: string | null;
  order: number;
};

export type EventItem = {
  id: number;
  title: string;
  slug: string;
  description: string;
  long_description: string;
  date: string;
  image: string | null;
  video: string | null;
  images: EventImageItem[];
  featured: boolean;
  order: number;
  text_colors?: Record<string, string>;
};

export type ServiceImageItem = {
  id: number;
  image: string | null;
  order: number;
};

export type ServiceItem = {
  id: number;
  title: string;
  slug: string;
  category: string;
  description: string;
  long_description: string;
  availability: string;
  quantity: string;
  price: string;
  highlights: string[];
  image: string | null;
  images: ServiceImageItem[];
  featured: boolean;
  order: number;
  text_colors?: Record<string, string>;
};

export type FeaturedVideo = {
  id: number;
  title: string;
  video: string | null;
  order: number;
  created_at: string;
};

export type Review = {
  id: number;
  name: string;
  role: string;
  rating: number;
  text: string;
  approved: boolean;
  order: number;
  text_colors?: Record<string, string>;
};

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
};

export type DashboardStats = {
  employees: number;
  events: number;
  services: number;
  featured_videos: number;
  reviews: number;
  reviews_pending: number;
  pages: number;
  page_banners: Record<string, boolean>;
};

export type BusinessBannerImageItem = {
  id: number;
  image: string | null;
  order: number;
};

export type BusinessGalleryImageItem = {
  id: number;
  section: "background" | "investment" | "overview";
  image: string | null;
  order: number;
};

export type BusinessTeamMember = {
  id: number;
  name: string;
  role: string;
  image: string | null;
  name_style: Record<string, unknown>;
  role_style: Record<string, unknown>;
  order: number;
  created_at: string;
};

export type BusinessHub = {
  id: number;
  banner_subtitle: string;
  banner_title: string;
  banner_body: string;
  banner_fields?: Record<string, boolean>;
  overview_title: string;
  overview_subtitle: string;
  overview_html: string;
  overview_image: string | null;
  businesses_title: string;
  businesses_subtitle: string;
  banner_images: BusinessBannerImageItem[];
  updated_at: string;
};

export type BusinessListItem = {
  id: number;
  slug: string;
  name: string;
  short_description: string;
  card_image: string | null;
  icon_key?: string;
  accent_color?: string;
  address?: string;
  phone?: string;
  maps_query?: string;
  order: number;
  is_active: boolean;
  updated_at: string;
};

export type BusinessDetail = BusinessListItem & {
  banner_subtitle: string;
  banner_title: string;
  banner_body: string;
  background_html: string;
  investment_history_html: string;
  overview_html: string;
  why_us?: string[];
  address: string;
  maps_query: string;
  section_meta?: Record<string, any>;
  banner_images: BusinessBannerImageItem[];
  gallery_images: BusinessGalleryImageItem[];
  team_members: BusinessTeamMember[];
};
