import { SVGProps } from "react";

interface WebIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * Web/globe icon – use for web, site, or global links.
 * ViewBox 0 0 100 100 for consistent scaling.
 */
export function WebIcon({ size = 24, className, ...props }: WebIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...props}
    >
      {/* Globe circle */}
      <circle
        cx="50"
        cy="50"
        r="42"
        stroke="currentColor"
        strokeWidth="6"
        fill="none"
      />
      {/* Latitude lines */}
      <ellipse
        cx="50"
        cy="50"
        rx="42"
        ry="14"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <ellipse
        cx="50"
        cy="50"
        rx="14"
        ry="42"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      {/* Center vertical */}
      <line
        x1="50"
        y1="8"
        x2="50"
        y2="92"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Center horizontal */}
      <line
        x1="8"
        y1="50"
        x2="92"
        y2="50"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
