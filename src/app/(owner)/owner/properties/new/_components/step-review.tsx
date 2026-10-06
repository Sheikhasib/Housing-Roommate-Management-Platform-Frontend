"use client";

import { Badge } from "@/components/ui/badge";
import { PROPERTY_TYPE_LABELS } from "@/lib/room-labels";
import { usePropertyWizardStore } from "@/store/property-wizard-store";

function Row({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="grid gap-1 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm break-words whitespace-pre-line text-foreground sm:col-span-2">{value}</dd>
    </div>
  );
}

/** Step 4: a read-only summary of everything that will be created. */
export function StepReview({ files }: { files: readonly File[] }) {
  const details = usePropertyWizardStore((state) => state.details);
  const units = usePropertyWizardStore((state) => state.units);
  const imagesUploaded = usePropertyWizardStore((state) => state.imagesUploaded);

  return (
    <div className="space-y-6">
      <section aria-labelledby="review-details" className="space-y-3">
        <h3 id="review-details" className="text-base font-semibold text-foreground">
          Details
        </h3>
        <dl className="space-y-3">
          <Row label="Title" value={details.title} />
          <Row label="Type" value={PROPERTY_TYPE_LABELS[details.type]} />
          <Row label="City" value={details.city} />
          <Row label="Area" value={details.area} />
          <Row label="Address" value={details.address} />
          <Row label="Google Maps link" value={details.googleMapUrl} />
          <Row label="Latitude" value={details.latitude} />
          <Row label="Longitude" value={details.longitude} />
          <Row label="Amenities" value={details.amenities.join(", ")} />
          <Row label="Description" value={details.description} />
          <Row label="House rules" value={details.houseRules} />
        </dl>
      </section>

      <section aria-labelledby="review-units" className="space-y-3">
        <h3 id="review-units" className="text-base font-semibold text-foreground">
          Units ({units.length})
        </h3>
        {units.length === 0 ? (
          <p className="text-sm text-muted-foreground">No units. You can add them later.</p>
        ) : (
          <ul className="space-y-2">
            {units.map((unit) => (
              <li key={unit.key} className="flex flex-wrap items-center gap-2 text-sm text-foreground">
                <span className="font-medium">{unit.label}</span>
                {unit.floor.trim() ? <Badge variant="neutral">Floor {unit.floor.trim()}</Badge> : null}
                {unit.createdId ? <Badge variant="success">Created</Badge> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="review-photos" className="space-y-3">
        <h3 id="review-photos" className="text-base font-semibold text-foreground">
          Photos ({imagesUploaded ? "uploaded" : files.length})
        </h3>
        {imagesUploaded ? (
          <p className="text-sm text-muted-foreground">The photos are already uploaded.</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-error-text">No photos chosen. Go back and add at least one.</p>
        ) : (
          <ul className="space-y-1 text-sm text-foreground">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}-${file.lastModified}`} className="truncate">
                {file.name}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
