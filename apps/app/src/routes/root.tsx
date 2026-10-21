import { createRootRoute, Outlet } from "@tanstack/react-router";

export const rootRoute = createRootRoute({
  component: () => (
    <main className="mx-auto min-h-dvh max-w-screen-sm p-4">
      <Outlet />
    </main>
  ),
});
