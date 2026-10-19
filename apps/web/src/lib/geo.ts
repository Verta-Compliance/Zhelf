export interface Coordinates {
  latitude: number;
  longitude: number;
}

const KM_PER_DEGREE = 111.32;
/** Listings are pinned to the centre of a grid cell this wide, never to an address. */
export const COORDINATE_GRID_KM = 5;

function clamp(value: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, value));
}

/** Snaps a point to a ~5 km grid. Longitude cells are widened by 1/cos(latitude) so they stay ~5 km wide. */
export function snapToGrid(latitude: number, longitude: number): Coordinates {
  const latitudeStep = COORDINATE_GRID_KM / KM_PER_DEGREE;
  const snappedLatitude = clamp(
    Math.round(latitude / latitudeStep) * latitudeStep,
    90,
  );

  const longitudeStep =
    COORDINATE_GRID_KM /
    (KM_PER_DEGREE *
      Math.max(Math.cos((snappedLatitude * Math.PI) / 180), 0.01));
  const snappedLongitude = clamp(
    Math.round(longitude / longitudeStep) * longitudeStep,
    180,
  );

  return {
    latitude: Math.round(snappedLatitude * 1e4) / 1e4,
    longitude: Math.round(snappedLongitude * 1e4) / 1e4,
  };
}

/** Returns grid-snapped coordinates, or null unless both values are valid. */
export function normalizeCoordinates(
  latitude: unknown,
  longitude: unknown,
): Coordinates | null {
  if (latitude === null || latitude === undefined) return null;
  if (longitude === null || longitude === undefined) return null;

  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return snapToGrid(lat, lng);
}
