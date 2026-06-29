import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiFetch, clearToken, getToken, setToken, type AdminUser } from "./api";

export function useMe() {
  return useQuery<AdminUser>({
    queryKey: ["admin", "me"],
    queryFn: () => apiFetch<AdminUser>("/auth/me/"),
    retry: false,
    enabled: typeof window !== "undefined" && !!getToken(),
    staleTime: 5 * 60 * 1000,
  });
}

export async function login(username: string, password: string): Promise<AdminUser> {
  const res = await apiFetch<{ token: string; user: AdminUser }>("/auth/login/", {
    method: "POST",
    body: { username, password },
    auth: false,
  });
  setToken(res.token);
  return res.user;
}

export async function logout() {
  try {
    await apiFetch("/auth/logout/", { method: "POST" });
  } catch {
    // ignore network errors on logout
  }
  clearToken();
}

/** Guard for protected admin pages: redirects to /admin/login when unauthenticated. */
export function useRequireAdmin() {
  const navigate = useNavigate();
  const hasToken = typeof window !== "undefined" && !!getToken();
  const { data, isLoading, isError, refetch } = useMe();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!getToken()) {
      navigate({ to: "/admin/login" });
    } else if (isError) {
      clearToken();
      navigate({ to: "/admin/login" });
    }
  }, [isError, navigate]);

  return {
    user: data,
    isLoading: hasToken ? isLoading : false,
    authed: hasToken && !isError,
    refresh: refetch,
  };
}
