import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import RouteLoading from "../components/route-loading";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <React.Fragment>
      <RouteLoading></RouteLoading>
      <Outlet></Outlet>
    </React.Fragment>
  );
}
