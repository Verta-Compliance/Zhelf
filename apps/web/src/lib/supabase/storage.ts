import { createSupabaseBrowserClient } from './client';

const BUCKET = 'listing-images';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 8;
const imageExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function uploadListingImages(files: File[]): Promise<{
  urls: string[];
  paths: string[];
}> {
  if (files.length > MAX_IMAGES) {
    throw new Error(`Choose no more than ${MAX_IMAGES} images.`);
  }

  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Sign in before uploading listing photos.');
  }

  const urls: string[] = [];
  const paths: string[] = [];

  try {
    for (const file of files) {
      const extension = imageExtensions[file.type];
      if (!extension) {
        throw new Error('Use a JPEG, PNG, WebP, or GIF image.');
      }
      if (file.size > MAX_IMAGE_BYTES) {
        throw new Error('Each image must be 5 MB or smaller.');
      }

      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        throw new Error(uploadError.message);
      }

      paths.push(path);
      urls.push(
        supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
      );
    }

    return { urls, paths };
  } catch (error) {
    if (paths.length) {
      await supabase.storage.from(BUCKET).remove(paths);
    }
    throw error;
  }
}

export async function removeListingImages(paths: string[]): Promise<void> {
  if (!paths.length) {
    return;
  }

  const { error } = await createSupabaseBrowserClient()
    .storage.from(BUCKET)
    .remove(paths);
  if (error) {
    throw new Error(error.message);
  }
}
