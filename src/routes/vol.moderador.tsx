import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/vol/moderador")({
  beforeLoad: () => {
    throw redirect({ to: "/vol/candidatura", replace: true });
  },
});
