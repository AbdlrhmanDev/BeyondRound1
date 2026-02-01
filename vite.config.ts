import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  plugins: [
    react(),
    ...(mode === "development" ? [componentTagger()] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react-dom/client": path.resolve(__dirname, "node_modules/react-dom/client"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: true,
    port: 8080,
    strictPort: false,
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    cssMinify: true,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? "";
          if (name.endsWith(".css")) return "assets/css/[name]-[hash][extname]";
          if (/\.(png|jpe?g|svg|gif|webp|avif|ico)$/i.test(name)) {
            return "assets/images/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return;
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("@stripe")) return "stripe";
          if (id.includes("@radix-ui")) return "radix-ui";
          if (id.includes("react-dom") || id.includes("react-router") || id.includes("/react/")) {
            return "react";
          }
          if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) {
            return "form";
          }
          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("recharts")) return "recharts";
        },
      },
      treeshake: {
        moduleSideEffects: "no-external",
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },
    commonjsOptions: {
      include: [/node_modules/],
    },
    esbuild: {
      drop: mode === "production" ? ["console", "debugger"] : [],
      legalComments: "none",
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js",
    ],
    exclude: ["recharts"],
    esbuildOptions: {
      target: "es2020",
    },
  },
}));
