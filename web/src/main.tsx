import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createHashHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import NotFound from "./components/not-found";
import { ThemeProvider } from "./provider/theme-provider";
import { Toast } from "@heroui/react";

const queryClient = new QueryClient();

const history = createHashHistory();

const router = createRouter({
  routeTree,
  history,
  defaultNotFoundComponent: NotFound,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <div className="flex flex-col md:flex-row min-h-dvh min-w-dvw max-h-dvh max-w-dvw overflow-hidden bg-main">
        <QueryClientProvider client={queryClient}>
          <Toast.Provider placement="top"></Toast.Provider>
          <RouterProvider router={router}></RouterProvider>
        </QueryClientProvider>
      </div>
    </ThemeProvider>
  </StrictMode>,
);
