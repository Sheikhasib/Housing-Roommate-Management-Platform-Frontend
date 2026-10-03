import {
  ArrowUpDown,
  Car,
  Cctv,
  Check,
  CookingPot,
  Droplets,
  Dumbbell,
  Fan,
  Flame,
  ShieldCheck,
  ShowerHead,
  Snowflake,
  Sofa,
  Tv,
  WashingMachine,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Keyword (lowercase) to icon. The first keyword found in an amenity name wins. */
const AMENITY_ICONS: ReadonlyArray<readonly [string, LucideIcon]> = [
  ["wifi", Wifi],
  ["wi-fi", Wifi],
  ["internet", Wifi],
  ["air", Snowflake],
  ["ac", Snowflake],
  ["gas", Flame],
  ["parking", Car],
  ["garage", Car],
  ["tv", Tv],
  ["kitchen", CookingPot],
  ["bath", ShowerHead],
  ["shower", ShowerHead],
  ["gym", Dumbbell],
  ["security", ShieldCheck],
  ["guard", ShieldCheck],
  ["cctv", Cctv],
  ["laundry", WashingMachine],
  ["washing", WashingMachine],
  ["generator", Zap],
  ["power", Zap],
  ["electric", Zap],
  ["water", Droplets],
  ["furnish", Sofa],
  ["fan", Fan],
  ["lift", ArrowUpDown],
  ["elevator", ArrowUpDown],
];

export function getAmenityIcon(name: string): LucideIcon {
  const key = name.toLowerCase();
  const hit = AMENITY_ICONS.find(([keyword]) =>
    keyword.length <= 3 ? key.split(/[^a-z]+/).includes(keyword) : key.includes(keyword),
  );
  return hit ? hit[1] : Check;
}
