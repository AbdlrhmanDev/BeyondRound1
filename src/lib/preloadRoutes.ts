/**
 * Preload route chunks on hover so navigation feels instant.
 * Call these from nav links' onMouseEnter / onFocus.
 */

export function preloadDashboard() {
  import("@/pages/Dashboard");
}

export function preloadMatches() {
  import("@/pages/Matches");
}

export function preloadProfile() {
  import("@/pages/Profile");
}

export function preloadSettings() {
  import("@/pages/Settings");
}

const preloadMap: Record<string, () => void> = {
  "/dashboard": preloadDashboard,
  "/matches": preloadMatches,
  "/profile": preloadProfile,
  "/settings": preloadSettings,
};

export function preloadRoute(path: string) {
  const preload = preloadMap[path];
  if (preload) preload();
}
