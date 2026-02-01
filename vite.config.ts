import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force a single React instance (prevents hooks dispatcher null)
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react-dom/client": path.resolve(__dirname, "./node_modules/react-dom/client"),
    },
    // Prevent duplicate React instances (can break hooks)
    dedupe: ["react", "react-dom"],
  },
  build: {
    minify: "esbuild", // Faster than terser and doesn't require installation
    minifySyntax: true,
    minifyIdentifiers: true,
    minifyWhitespace: true,
    // Remove console statements
    esbuild: {
      drop: ["console", "debugger"],
      legalComments: "none",
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
    },
    // Optimize asset inlining - inline small assets to reduce requests
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    // Report compressed size
    reportCompressedSize: true,
    // Reduce chunk size for better loading
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Optimize chunk file names
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "assets/css/[name]-[hash][extname]";
          }
          if (/\.(png|jpe?g|svg|gif|webp|avif)$/.test(assetInfo.name || "")) {
            return "assets/images/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
        // Better code splitting - smaller chunks for faster loading
        experimentalMinChunkSize: 20000, // 20KB minimum chunk size
        // Manual chunks for better caching
        manualChunks: (id) => {
          // Split vendor code for better caching
          if (id.includes("node_modules")) {
            // React core - most critical, load first
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "react-vendor";
            }
            // Large UI libraries
            if (id.includes("@radix-ui")) {
              return "radix-ui-vendor";
            }
            // Form libraries
            if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) {
              return "form-vendor";
            }
            // Query library
            if (id.includes("@tanstack/react-query")) {
              return "query-vendor";
            }
            // Backend SDKs
            if (id.includes("@supabase")) {
              return "supabase-vendor";
            }
            if (id.includes("@stripe")) {
              return "stripe-vendor";
            }
            // Chart library
            if (id.includes("recharts")) {
              return "chart-vendor";
            }
          }
        },
      },
      treeshake: {
        moduleSideEffects: "no-external",
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },
    // Increase chunk size warning limit
    // chunkSizeWarningLimit: 1000,
    // Disable source maps for production (smaller bundle)
    sourcemap: false,
    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,
    // Target modern browsers for smaller output
    target: "esnext",
    // Enable module preload
    modulePreload: {
      polyfill: false,
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js",
    ],
    exclude: [
      // Exclude large libraries that should be lazy loaded
      "recharts",
    ],
    esbuildOptions: {
      target: "esnext",
    },
  },
}));
