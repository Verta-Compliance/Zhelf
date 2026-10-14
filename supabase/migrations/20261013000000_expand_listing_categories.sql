DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'listings'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%category%'
  LOOP
    EXECUTE format('ALTER TABLE listings DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE listings
  ADD CONSTRAINT listings_category_check CHECK (category IN (
    'Books', 'Clothing', 'Shoes & Accessories', 'Electronics', 'Home & Garden',
    'Toys & Games', 'Kids & Baby', 'Sports & Outdoors', 'Music & Instruments',
    'Beauty & Personal Care', 'Art & Crafts', 'Movies & Media', 'Pet Supplies',
    'Stationery & Office'
  ));
