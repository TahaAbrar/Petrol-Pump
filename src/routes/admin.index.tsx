import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { getToken } from "@/lib/api";

export const Route = createFileRoute("/admin/")({
  component: AdminIndex,
});

function AdminIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    if (typeof window === "undefined") return;
    navigate({ to: getToken() ? "/admin/dashboard" : "/admin/login" });
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-mesh">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
