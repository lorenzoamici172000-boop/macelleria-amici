import type { SupabaseClient } from '@supabase/supabase-js';
import { generateSafeFilename } from '@/utils/helpers';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/utils/validation';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a file to Supabase Storage with validation.
 * Returns the public URL on success.
 */
export async function uploadFile(
  supabase: SupabaseClient,
  bucket: string,
  file: File,
  options?: {
    subfolder?: string;
    allowedTypes?: string[];
    maxSize?: number;
  }
): Promise<UploadResult> {
  const allowedTypes = options?.allowedTypes ?? ALLOWED_IMAGE_TYPES;
  const maxSize = options?.maxSize ?? MAX_FILE_SIZE;

  // Validate type
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: `Formato non supportato. Formati consentiti: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`,
    };
  }

  // Validate size
  if (file.size > maxSize) {
    const maxMb = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      success: false,
      error: `File troppo grande. Massimo ${maxMb}MB.`,
    };
  }

  // Generate safe filename
  const safeName = generateSafeFilename(file.name);
  const path = options?.subfolder ? `${options.subfolder}/${safeName}` : safeName;

  // Upload
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    success: true,
    url: urlData.publicUrl,
  };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Extract the storage path from a public URL
 */
export function getPathFromUrl(url: string, bucket: string): string | null {
  try {
    const match = url.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)`));
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
