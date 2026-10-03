import { getAmenityIcon } from "@/lib/amenity-icons";

export function RoomAmenities({ amenities }: { amenities: string[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
      {amenities.map((amenity) => {
        const Icon = getAmenityIcon(amenity);
        return (
          <li
            key={amenity}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 truncate">{amenity}</span>
          </li>
        );
      })}
    </ul>
  );
}
