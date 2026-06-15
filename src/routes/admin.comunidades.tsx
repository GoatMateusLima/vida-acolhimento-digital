import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/comunidades")({
  component: Outlet,
});
