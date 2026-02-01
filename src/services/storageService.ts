/**
 * Storage Service - Handles file storage operations
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Uploads a file to storage
 */
export const uploadFile = async (
  bucket: string,
  filePath: string,
  file: File,
  options?: { upsert?: boolean }
): Promise<string | null> => {
  try {
    // Input validation
    if (!bucket?.trim()) {
      console.error("Invalid bucket for uploadFile:", bucket);
      return null;
    }

    if (!filePath?.trim()) {
      console.error("Invalid filePath for uploadFile:", filePath);
      return null;
    }

    if (!file || !(file instanceof File)) {
      console.error("Invalid file for uploadFile:", file);
      return null;
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: options?.upsert ?? false });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    return null;
  }
};

/**
 * Uploads a photo to storage
 */
export const uploadPhoto = async (
  bucket: string,
  filePath: string,
  file: File
): Promise<string | null> => {
  return uploadFile(bucket, filePath, file);
};

/**
 * Uploads multiple photos to storage
 */
export const uploadPhotos = async (
  bucket: string,
  files: File[],
  basePath: string
): Promise<string[]> => {
  try {
    // Input validation
    if (!bucket?.trim()) {
      console.error("Invalid bucket for uploadPhotos:", bucket);
      return [];
    }

    if (!Array.isArray(files) || files.length === 0) {
      console.error("Invalid files array for uploadPhotos:", files);
      return [];
    }

    if (!basePath?.trim()) {
      console.error("Invalid basePath for uploadPhotos:", basePath);
      return [];
    }

    const uploadPromises = files.map(async (file, index) => {
      if (!file || !(file instanceof File)) {
        console.warn(`Invalid file at index ${index} in uploadPhotos`);
        return null;
      }
      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `${basePath}/${Date.now()}-${index}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      return await uploadPhoto(bucket, filePath, file);
    });

    const urls = await Promise.all(uploadPromises);
    return urls.filter((url): url is string => url !== null);
  } catch (error) {
    console.error("Error uploading photos:", error);
    return [];
  }
};

/**
 * Uploads avatar image
 */
export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  // Input validation
  if (!userId?.trim()) {
    console.error("Invalid userId for uploadAvatar:", userId);
    return null;
  }

  if (!file || !(file instanceof File)) {
    console.error("Invalid file for uploadAvatar:", file);
    return null;
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const filePath = `${userId}/avatar.${fileExt}`;
  return uploadFile('avatars', filePath, file, { upsert: true });
};

/**
 * Uploads license document
 */
export const uploadLicense = async (userId: string, file: File): Promise<string | null> => {
  // Input validation
  if (!userId?.trim()) {
    console.error("Invalid userId for uploadLicense:", userId);
    return null;
  }

  if (!file || !(file instanceof File)) {
    console.error("Invalid file for uploadLicense:", file);
    return null;
  }

  const fileExt = file.name.split('.').pop() || 'pdf';
  const filePath = `${userId}/license.${fileExt}`;
  return uploadFile('licenses', filePath, file, { upsert: true });
};
