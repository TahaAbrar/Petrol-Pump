// Lightweight API client for the Django backend.
const RAW_API_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
  "http://localhost:8000/api";

export const API_URL = RAW_API_URL.replace(/\/$/, "");
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
  text_colors?: Record<string, string>;
};

export type PageContent = {
  id: number;
  key: string;
  title: string;
  subtitle: string;
  body: string;
  banner: string | null;
  story_image: string | null;
  founder_image: string | null;
  ceo2_image: string | null;
  manager_image: string | null;
  extra: Record<string, any>;
  updated_at: string;
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
