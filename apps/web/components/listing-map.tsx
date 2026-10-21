import { staticMapUrl } from '../src/lib/mapbox';

export default function ListingMap({
  latitude,
  longitude,
  location,
}: {
  latitude: number | null;
  longitude: number | null;
  location: string;
}) {
  if (latitude === null || longitude === null) return null;
  const src = staticMapUrl(latitude, longitude);
  if (!src) return null;

  return (
    <figure className='listing-map'>
      <img
        src={src}
        alt={`Map of the area around ${location}`}
        loading='lazy'
        width={640}
        height={280}
      />
      <figcaption className='muted'>Approximate area: {location}</figcaption>
    </figure>
  );
}
