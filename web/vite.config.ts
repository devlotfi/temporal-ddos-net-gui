import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: true,
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  optimizeDeps: {
    include: ["react-plotly.js", "plotly.js"],
  },
  build: {
    outDir: "../docs",
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "lucide-react",
              test: /node_modules\/lucide-react/,
            },
            {
              name: "heroui",
              test: /node_modules\/@heroui/,
            },
          ],
        },
      },
    },
  },
});
