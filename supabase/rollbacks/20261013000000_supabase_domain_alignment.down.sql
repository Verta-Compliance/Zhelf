DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS swaps;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS offers;

DO $migration$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS listing_images_insert_own_folder ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS listing_images_update_own_folder ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS listing_images_delete_own_folder ON storage.objects';
  END IF;
END;
$migration$;