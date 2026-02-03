import { clsx, type ClassValue } from "clsx";

/** clsx only – avoids tailwind-merge vendor-chunk resolution errors in Next.js dev */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
