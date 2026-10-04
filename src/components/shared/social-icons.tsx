import type { ReactElement } from "react";

import type { SocialName } from "@/lib/constants";

const svgProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
  focusable: false,
} as const;

const strokeProps = {
  ...svgProps,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const ICONS: Record<SocialName, () => ReactElement> = {
  Email: () => (
    <svg {...strokeProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  Facebook: () => (
    <svg {...svgProps}>
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z" />
    </svg>
  ),
  LinkedIn: () => (
    <svg {...svgProps}>
      <path d="M5.1 9.2h3.2V19H5.1V9.2Zm1.6-5a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8ZM10.3 9.2h3v1.3h.1c.4-.8 1.5-1.6 3-1.6 3.2 0 3.8 2.1 3.8 4.8V19H17v-4.6c0-1.1 0-2.5-1.5-2.5s-1.8 1.2-1.8 2.400V19h-3.400V9.200Z" />
    </svg>
  ),
  GitHub: () => (
    <svg {...svgProps}>
      <path d="M12 2.5a9.5 9.5 0 0 0-3 18.500c.5.1.7-.2.7-.5v-1.700c-2.700.6-3.200-1.300-3.200-1.300-.4-1.100-1.100-1.400-1.100-1.400-.9-.6.100-.6.100-.6 1 .1 1.500 1 1.500 1 .9 1.500 2.300 1.100 2.900.8.1-.6.3-1.100.6-1.300-2.100-.2-4.400-1.100-4.400-4.700 0-1 .4-1.900 1-2.600-.1-.2-.4-1.200.1-2.500 0 0 .8-.3 2.600 1a9 9 0 0 1 4.700 0c1.800-1.200 2.600-1 2.600-1 .5 1.300.2 2.300.1 2.500.6.700 1 1.600 1 2.600 0 3.600-2.200 4.400-4.400 4.700.3.300.7.900.7 1.800V20c0 .3.2.6.7.5A9.500 9.500 0 0 0 12 2.500Z" />
    </svg>
  ),
  X: () => (
    <svg {...svgProps}>
      <path d="M17.700 3.500h3L14.100 11l7.800 9.500h-6.100l-4.800-5.800-5.300 5.800h-3l7.100-8L2.400 3.500h6.200l4.300 5.300 4.800-5.300Zm-1 15.200h1.700L7.700 5.200H5.900l10.800 13.500Z" />
    </svg>
  ),
  Instagram: () => (
    <svg {...strokeProps}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.500" cy="6.500" r="0.600" fill="currentColor" />
    </svg>
  ),
  YouTube: () => (
    <svg {...svgProps}>
      <path d="M21.600 7.200a2.500 2.500 0 0 0-1.800-1.800C18.200 5 12 5 12 5s-6.200 0-7.800.4A2.500 2.500 0 0 0 2.400 7.200C2 8.800 2 12 2 12s0 3.200.4 4.800a2.500 2.500 0 0 0 1.800 1.800C5.800 19 12 19 12 19s6.200 0 7.800-.4a2.500 2.500 0 0 0 1.800-1.800c.4-1.600.4-4.800.4-4.800s0-3.200-.4-4.800ZM10 15V9l5.200 3-5.200 3Z" />
    </svg>
  ),
};

export function SocialIcon({ name }: { name: SocialName }) {
  const Icon = ICONS[name];
  return <Icon />;
}
