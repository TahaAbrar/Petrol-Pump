import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Layout for /about and nested routes — child pages render via Outlet. */
export const Route = createFileRoute("/about")({
  component: () => <Outlet />,
});
