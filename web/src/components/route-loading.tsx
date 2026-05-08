import { useRouterState } from "@tanstack/react-router";

export default function RouteLoading() {
  const { isLoading } = useRouterState();

  if (isLoading) {
    return (
      <div className="fixed top-0 left-0 w-dvw h-1 bg-[color-mix(in_srgb,var(--accent),transparent_70%)] overflow-hidden z-50">
        <div className="h-full w-2/5 bg-accent animate-loading"></div>
      </div>
    );
  }
}
