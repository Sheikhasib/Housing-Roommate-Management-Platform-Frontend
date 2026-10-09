interface MapLocation {
  googleMapUrl: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
}

/** Google Maps link from the owner's map URL or the pin coordinates. Null when neither is usable. */
export function getMapHref(location: MapLocation | null): string | null {
  if (!location) return null;
  // The map URL is written by the owner: only an https link is rendered.
  if (location.googleMapUrl?.startsWith("https://")) return location.googleMapUrl;

  const lat = Number(location.latitude);
  const lng = Number(location.longitude);
  const hasPin =
    location.latitude !== null &&
    location.longitude !== null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180;
  return hasPin ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null;
}
