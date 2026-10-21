ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_coordinates_check,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude;
