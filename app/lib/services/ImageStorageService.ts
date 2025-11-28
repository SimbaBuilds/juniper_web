import { createClient } from '@/lib/utils/supabase/client';
import { sanitizeFilename } from '@/app/lib/utils/sanitizeFilename';

export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class ImageStorageService {
  private static readonly BUCKET_NAME = 'chat-images';
  private static supabase = createClient();

  /**
   * Upload an image to Supabase Storage for chat messages
   */
  static async uploadChatImage(
    userId: string,
    file: File,
    fileName?: string
  ): Promise<ImageUploadResult> {
    console.log('🔄 ImageStorageService: Starting image upload', {
      userId,
      fileName: fileName || file.name,
      fileSize: file.size,
      fileType: file.type
    });

    try {
      // Validate inputs
      if (!userId) {
        const error = 'User ID is required for image upload';
        console.error('❌ ImageStorageService:', error);
        return { success: false, error };
      }

      if (!file) {
        const error = 'File is required for upload';
        console.error('❌ ImageStorageService:', error);
        return { success: false, error };
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        const error = 'Only image files are allowed';
        console.error('❌ ImageStorageService:', error);
        return { success: false, error };
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        const error = 'File size must be less than 10MB';
        console.error('❌ ImageStorageService:', error);
        return { success: false, error };
      }

      // Check if user is authenticated
      console.log('🔄 ImageStorageService: Checking user authentication');
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ ImageStorageService: Auth error:', authError);
        return { success: false, error: `Authentication error: ${authError.message}` };
      }

      if (!user) {
        console.error('❌ ImageStorageService: User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      console.log('✅ ImageStorageService: User authenticated', { userId: user.id });

      // Generate file name if not provided
      const baseName = fileName || file.name;
      const sanitizedBaseName = sanitizeFilename(baseName);
      const extension = file.type.split('/')[1];
      const finalFileName = fileName ? sanitizedBaseName : `image_${Date.now()}.${extension}`;

      // Create file path: userId/images/filename
      const filePath = `${userId}/images/${finalFileName}`;
      console.log('🔄 ImageStorageService: Uploading to path', { filePath });

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(ImageStorageService.BUCKET_NAME)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (error) {
        console.error('❌ ImageStorageService: Supabase upload error:', {
          error: error.message,
          name: error.name
        });
        return { success: false, error: error.message };
      }

      console.log('✅ ImageStorageService: Upload successful', { data });

      // Get public URL
      const imageUrl = ImageStorageService.getPublicUrl(filePath);
      console.log('✅ ImageStorageService: Public URL generated', { imageUrl });
      
      return { 
        success: true, 
        imageUrl 
      };

    } catch (error) {
      console.error('❌ ImageStorageService: Unexpected error during upload:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during image upload' 
      };
    }
  }

  /**
   * Upload image from base64 data (for compatibility with React Native patterns)
   */
  static async uploadChatImageFromBase64(
    userId: string,
    base64Data: string,
    fileName?: string,
    mimeType: string = 'image/jpeg'
  ): Promise<ImageUploadResult> {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Create File object
      const file = new File([blob], fileName || `image_${Date.now()}.jpg`, { type: mimeType });
      
      // Use regular upload method
      return await this.uploadChatImage(userId, file, fileName);

    } catch (error) {
      console.error('❌ ImageStorageService: Error converting base64:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process base64 image'
      };
    }
  }

  /**
   * Get public URL for an image
   */
  static getPublicUrl(filePath: string): string {
    const { data } = this.supabase.storage
      .from(ImageStorageService.BUCKET_NAME)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  /**
   * Delete an image from storage
   */
  static async deleteImage(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.storage
        .from(ImageStorageService.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Error deleting image:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get file size limit in bytes
   */
  static getFileSizeLimit(): number {
    return 10 * 1024 * 1024; // 10MB
  }

  /**
   * Check if file type is supported
   */
  static isSupportedFileType(mimeType: string): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
    ];
    return supportedTypes.includes(mimeType.toLowerCase());
  }
}